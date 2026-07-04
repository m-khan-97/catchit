import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchDevpostCandidates } from "./devpost";
import { fetchWikiCfpCandidates } from "./wikicfp";
import { submitSearchBatch, pollSearchBatch, type BatchTask } from "./batch";
import { QUERY_POOLS, pickQueriesForToday, shouldRunCategoryToday } from "./queries";
import { dedupCandidates } from "./dedup";
import { candidateSchema, type Candidate } from "./schema";
import { sendCronFailureAlert } from "@/lib/discord";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

interface SourceCount {
  found: number;
  inserted: number;
  skipped: number;
  failed: number;
}

export interface DiscoveryRunSummary {
  status: "completed" | "awaiting_batch";
  sourceCounts: Record<string, SourceCount>;
  found: number;
  inserted: number;
  skipped: number;
  failed: number;
  errorNotes: string[];
  batchId?: string;
}

export interface DiscoveryCollectSummary {
  batchesChecked: number;
  batchesCompleted: number;
  batchesStillPending: number;
  totalInserted: number;
  errorNotes: string[];
}

interface CandidateEntry {
  source: string;
  candidate: Candidate;
}

const AI_SEARCH_CATEGORIES = [
  "voucher",
  "event",
  "scholarship",
  "internship",
  "conference",
  "journal",
] as const;
const QUERIES_PER_CATEGORY = 4;
// Batches guarantee results within 24h; treat anything older as stuck rather
// than silently polling forever.
const BATCH_MAX_AGE_MS = 26 * 60 * 60 * 1000;

type AdminClient = SupabaseClient<Database>;

/** Validates, dedupes, and inserts a batch of raw candidates as pending
 * opportunities — shared between the synchronous (Devpost/WikiCFP) and
 * batch-collection (AI-search) paths so both go through identical checks.
 * Mutates `sourceCounts` in place with skipped/inserted counts. */
async function validateDedupInsert(
  supabase: AdminClient,
  rawEntries: CandidateEntry[],
  sourceCounts: Record<string, SourceCount>
): Promise<{ inserted: number; skipped: number; failedInserts: number; errorNotes: string[] }> {
  const validEntries: CandidateEntry[] = [];
  for (const entry of rawEntries) {
    const parsed = candidateSchema.safeParse(entry.candidate);
    if (parsed.success) validEntries.push({ source: entry.source, candidate: parsed.data });
  }

  const { survivors, skipped } = await dedupCandidates(supabase, validEntries);

  const survivorCountBySource = new Map<string, number>();
  for (const { source } of survivors) {
    survivorCountBySource.set(source, (survivorCountBySource.get(source) ?? 0) + 1);
  }
  const validCountBySource = new Map<string, number>();
  for (const { source } of validEntries) {
    validCountBySource.set(source, (validCountBySource.get(source) ?? 0) + 1);
  }
  for (const [source, validCount] of validCountBySource) {
    if (!sourceCounts[source]) continue;
    sourceCounts[source].skipped = validCount - (survivorCountBySource.get(source) ?? 0);
  }

  let inserted = 0;
  let failedInserts = 0;
  const errorNotes: string[] = [];

  for (const { source, candidate } of survivors) {
    const { error } = await supabase.from("opportunities").insert({
      title: candidate.title,
      organization: candidate.organization,
      category: candidate.category,
      snippet: candidate.snippet,
      description: candidate.description,
      eligibility: candidate.eligibility ?? [],
      url: candidate.url,
      deadline: candidate.deadline ?? null,
      deadline_note: candidate.deadline_note ?? null,
      region_tags: candidate.region_tags ?? [],
      audience_tags: candidate.audience_tags ?? [],
      source,
      status: "pending",
    });
    if (error) {
      failedInserts++;
      errorNotes.push(`insert failed for "${candidate.title}": ${error.message}`);
    } else {
      inserted++;
      if (sourceCounts[source]) sourceCounts[source].inserted++;
    }
  }

  return { inserted, skipped, failedInserts, errorNotes };
}

/**
 * Runs Devpost + WikiCFP synchronously (structured, free, fast) and inserts
 * their survivors immediately. AI-search queries are submitted as a single
 * Message Batch (50% off the synchronous price) instead of run in-request —
 * results are picked up later by `collectDiscoveryBatches`, called from a
 * separate cron a couple of hours after this one.
 */
export async function runDiscovery(): Promise<DiscoveryRunSummary> {
  const supabase = createAdminClient();

  const { data: runRow, error: runInsertError } = await supabase
    .from("discovery_runs")
    .insert({ status: "running" })
    .select("id")
    .single();
  if (runInsertError) throw runInsertError;
  const runId = runRow.id;

  const errorNotes: string[] = [];
  const sourceCounts: Record<string, SourceCount> = {};
  const rawEntries: CandidateEntry[] = [];

  try {
    // 1. Devpost — structured, primary hackathon source.
    try {
      const { candidates, discarded } = await fetchDevpostCandidates();
      sourceCounts.devpost = {
        found: candidates.length + discarded,
        inserted: 0,
        skipped: 0,
        failed: discarded,
      };
      for (const candidate of candidates) rawEntries.push({ source: "devpost", candidate });
    } catch (err) {
      sourceCounts.devpost = { found: 0, inserted: 0, skipped: 0, failed: 0 };
      errorNotes.push(`devpost: ${err instanceof Error ? err.message : String(err)}`);
    }

    // 2. WikiCFP — structured-ish, primary conference source.
    try {
      const { candidates, discarded } = await fetchWikiCfpCandidates();
      sourceCounts.wikicfp = {
        found: candidates.length + discarded,
        inserted: 0,
        skipped: 0,
        failed: discarded,
      };
      for (const candidate of candidates) rawEntries.push({ source: "wikicfp", candidate });
    } catch (err) {
      sourceCounts.wikicfp = { found: 0, inserted: 0, skipped: 0, failed: 0 };
      errorNotes.push(`wikicfp: ${err instanceof Error ? err.message : String(err)}`);
    }

    const { inserted, skipped, failedInserts, errorNotes: insertErrors } =
      await validateDedupInsert(supabase, rawEntries, sourceCounts);
    errorNotes.push(...insertErrors);

    // 3. AI web-search — supplements every category; primary for vouchers,
    // events, scholarships, internships, and journals. Low-churn categories
    // (see shouldRunCategoryToday) only run 2 days a week.
    const tasks: BatchTask[] = [];
    for (const category of AI_SEARCH_CATEGORIES) {
      if (!shouldRunCategoryToday(category)) continue;
      const pool = QUERY_POOLS[category] ?? [];
      for (const query of pickQueriesForToday(pool, QUERIES_PER_CATEGORY)) {
        tasks.push({ category, query });
      }
    }

    for (const category of AI_SEARCH_CATEGORIES) {
      sourceCounts[`ai-search:${category}`] = { found: 0, inserted: 0, skipped: 0, failed: 0 };
    }

    const totalFound = Object.values(sourceCounts).reduce((sum, r) => sum + r.found, 0);
    const totalFailed =
      Object.values(sourceCounts).reduce((sum, r) => sum + r.failed, 0) + failedInserts;

    if (tasks.length === 0) {
      // Shouldn't happen (event/internship always run), but don't leave the
      // run open waiting for a batch that was never submitted.
      await supabase
        .from("discovery_runs")
        .update({
          status: "completed",
          finished_at: new Date().toISOString(),
          source_counts: sourceCounts,
          found_count: totalFound,
          inserted_count: inserted,
          skipped_count: skipped,
          failed_count: totalFailed,
          error_notes: errorNotes.length > 0 ? errorNotes.join("\n") : null,
        })
        .eq("id", runId);

      return {
        status: "completed",
        sourceCounts,
        found: totalFound,
        inserted,
        skipped,
        failed: totalFailed,
        errorNotes,
      };
    }

    const { batchId, taskMap } = await submitSearchBatch(tasks);

    const { error: batchInsertError } = await supabase.from("discovery_batches").insert({
      run_id: runId,
      batch_id: batchId,
      task_map: taskMap,
      status: "submitted",
    });
    if (batchInsertError) throw batchInsertError;

    await supabase
      .from("discovery_runs")
      .update({
        status: "awaiting_batch",
        source_counts: sourceCounts,
        found_count: totalFound,
        inserted_count: inserted,
        skipped_count: skipped,
        failed_count: totalFailed,
        error_notes: errorNotes.length > 0 ? errorNotes.join("\n") : null,
      })
      .eq("id", runId);

    return {
      status: "awaiting_batch",
      sourceCounts,
      found: totalFound,
      inserted,
      skipped,
      failed: totalFailed,
      errorNotes,
      batchId,
    };
  } catch (err) {
    // Whatever failed, make sure the run row doesn't sit at "running"
    // forever — that's confusing in the admin panel and looks like a
    // hung job rather than a completed failure.
    await supabase
      .from("discovery_runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        source_counts: sourceCounts,
        error_notes: [...errorNotes, err instanceof Error ? err.message : String(err)].join("\n"),
      })
      .eq("id", runId);
    throw err;
  }
}

/**
 * Polls every discovery_batches row still marked "submitted": finalizes the
 * parent discovery_runs row (merging AI-search counts into what runDiscovery
 * already recorded for Devpost/WikiCFP) once a batch has ended, and flags
 * anything stuck past the 24h guarantee as failed.
 */
export async function collectDiscoveryBatches(): Promise<DiscoveryCollectSummary> {
  const supabase = createAdminClient();

  const { data: pending, error: pendingError } = await supabase
    .from("discovery_batches")
    .select("*")
    .eq("status", "submitted");
  if (pendingError) throw pendingError;

  const errorNotes: string[] = [];
  let batchesCompleted = 0;
  let totalInserted = 0;

  for (const batchRow of pending ?? []) {
    try {
      const { ended, results } = await pollSearchBatch(batchRow.batch_id, batchRow.task_map);

      if (!ended) {
        const age = Date.now() - new Date(batchRow.created_at).getTime();
        if (age > BATCH_MAX_AGE_MS) {
          await supabase.from("discovery_batches").update({ status: "failed" }).eq("id", batchRow.id);
          await supabase
            .from("discovery_runs")
            .update({
              status: "failed",
              finished_at: new Date().toISOString(),
              error_notes: "AI-search batch did not complete within the expected window",
            })
            .eq("id", batchRow.run_id);
          await sendCronFailureAlert(
            "Discovery batch collection",
            `Batch ${batchRow.batch_id} (run ${batchRow.run_id}) has been pending for over 26h — marked failed.`
          );
        }
        continue;
      }

      const { data: parentRun, error: parentRunError } = await supabase
        .from("discovery_runs")
        .select("*")
        .eq("id", batchRow.run_id)
        .single();
      if (parentRunError) throw parentRunError;

      const sourceCounts = { ...parentRun.source_counts } as Record<string, SourceCount>;
      const rawEntries: CandidateEntry[] = [];
      let aiSearchErrors = 0;
      let firstAiSearchError: string | undefined;

      for (const { category, query, result } of results) {
        const sourceName = `ai-search:${category}`;
        if (!sourceCounts[sourceName]) {
          sourceCounts[sourceName] = { found: 0, inserted: 0, skipped: 0, failed: 0 };
        }
        const { candidates, discarded, error } = result;
        if (error) {
          errorNotes.push(`${sourceName} ("${query}"): ${error}`);
          aiSearchErrors++;
          firstAiSearchError ??= error;
        }
        sourceCounts[sourceName].found += candidates.length + discarded;
        sourceCounts[sourceName].failed += discarded;
        for (const candidate of candidates) rawEntries.push({ source: sourceName, candidate });
      }

      // Same "every single AI-search call failed" alert as the old
      // synchronous path — a systemic failure (billing, auth, outage)
      // shouldn't just quietly report zero results.
      if (results.length > 0 && aiSearchErrors === results.length) {
        await sendCronFailureAlert(
          "Discovery (AI search degraded)",
          `All ${results.length} AI-search queries failed in batch ${batchRow.batch_id}. First error: ${firstAiSearchError}`
        );
      }

      const {
        inserted,
        skipped,
        failedInserts,
        errorNotes: insertErrors,
      } = await validateDedupInsert(supabase, rawEntries, sourceCounts);
      errorNotes.push(...insertErrors);
      totalInserted += inserted;

      const totalFound = Object.values(sourceCounts).reduce((sum, r) => sum + r.found, 0);
      const totalFailed =
        Object.values(sourceCounts).reduce((sum, r) => sum + r.failed, 0) + failedInserts;
      const combinedErrorNotes = [parentRun.error_notes, ...errorNotes].filter(Boolean).join("\n");

      await supabase
        .from("discovery_runs")
        .update({
          status: "completed",
          finished_at: new Date().toISOString(),
          source_counts: sourceCounts,
          found_count: totalFound,
          inserted_count: parentRun.inserted_count + inserted,
          skipped_count: parentRun.skipped_count + skipped,
          failed_count: totalFailed,
          error_notes: combinedErrorNotes || null,
        })
        .eq("id", batchRow.run_id);

      await supabase
        .from("discovery_batches")
        .update({ status: "collected", collected_at: new Date().toISOString() })
        .eq("id", batchRow.id);

      batchesCompleted++;
    } catch (err) {
      errorNotes.push(
        `batch ${batchRow.batch_id}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return {
    batchesChecked: pending?.length ?? 0,
    batchesCompleted,
    batchesStillPending: (pending?.length ?? 0) - batchesCompleted,
    totalInserted,
    errorNotes,
  };
}
