import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchDevpostCandidates } from "./devpost";
import { fetchWikiCfpCandidates } from "./wikicfp";
import { searchForCandidates, type SearchResult } from "./ai-search";
import { QUERY_POOLS, pickQueriesForToday } from "./queries";
import { dedupCandidates } from "./dedup";
import { candidateSchema, type Candidate } from "./schema";

/**
 * Runs `fn` over `items` with at most `limit` in flight at once. AI-search
 * queries hit the Anthropic API with web_search enabled, which can take
 * 10-20+ seconds each — running all ~23 of them sequentially risks
 * exceeding Vercel's function time budget, so we fan out with a cap
 * instead of hammering the API fully unbounded.
 */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await fn(items[current]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

interface SourceCount {
  found: number;
  inserted: number;
  skipped: number;
  failed: number;
}

export interface DiscoveryRunSummary {
  sourceCounts: Record<string, SourceCount>;
  found: number;
  inserted: number;
  skipped: number;
  failed: number;
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

    // 3. AI web-search — supplements every category; primary for vouchers,
    // events, scholarships, internships, and journals. Queries across all
    // categories are fanned out with a concurrency cap rather than run
    // sequentially — each web_search-enabled call can take 10-20+ seconds,
    // and ~23 of them in a row would risk the function's time budget.
    const tasks: { category: (typeof AI_SEARCH_CATEGORIES)[number]; query: string }[] = [];
    for (const category of AI_SEARCH_CATEGORIES) {
      const pool = QUERY_POOLS[category] ?? [];
      for (const query of pickQueriesForToday(pool, QUERIES_PER_CATEGORY)) {
        tasks.push({ category, query });
      }
    }

    for (const category of AI_SEARCH_CATEGORIES) {
      sourceCounts[`ai-search:${category}`] = { found: 0, inserted: 0, skipped: 0, failed: 0 };
    }

    const AI_SEARCH_CONCURRENCY = 5;
    const taskResults = await mapWithConcurrency(tasks, AI_SEARCH_CONCURRENCY, async (task) => {
      try {
        return { task, result: await searchForCandidates(task.query) };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { task, result: { candidates: [], discarded: 0, error: message } as SearchResult };
      }
    });

    for (const { task, result } of taskResults) {
      const sourceName = `ai-search:${task.category}`;
      const { candidates, discarded, error } = result;
      if (error) errorNotes.push(`${sourceName} ("${task.query}"): ${error}`);
      sourceCounts[sourceName].found += candidates.length + discarded;
      sourceCounts[sourceName].failed += discarded;
      for (const candidate of candidates) rawEntries.push({ source: sourceName, candidate });
    }

    // Validate every candidate uniformly, regardless of which source produced it.
    const validEntries: CandidateEntry[] = [];
    for (const entry of rawEntries) {
      const parsed = candidateSchema.safeParse(entry.candidate);
      if (parsed.success) validEntries.push({ source: entry.source, candidate: parsed.data });
    }

    const { survivors, skipped } = await dedupCandidates(supabase, validEntries);

    // Attribute skipped (deduped) candidates back to their source for logging.
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

    const totalFound = Object.values(sourceCounts).reduce((sum, r) => sum + r.found, 0);
    const totalFailed =
      Object.values(sourceCounts).reduce((sum, r) => sum + r.failed, 0) + failedInserts;

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
      sourceCounts,
      found: totalFound,
      inserted,
      skipped,
      failed: totalFailed,
      errorNotes,
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
