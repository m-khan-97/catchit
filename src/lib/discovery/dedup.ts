import "server-only";
import stringSimilarity from "string-similarity";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { Candidate } from "./schema";

const FUZZY_THRESHOLD = 0.85;

function normalizeUrl(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "");
}

function normalizeTitle(raw: string): string {
  return raw.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Dedupes discovered candidates against every existing row (any status —
 * rejected items must still block re-discovery) and against each other
 * within this run. Generic over any entry shape wrapping a `candidate`, so
 * callers can carry extra fields (like `source`) through without a
 * fragile post-hoc remap by URL.
 */
export async function dedupCandidates<T extends { candidate: Candidate }>(
  supabase: SupabaseClient<Database>,
  entries: T[]
): Promise<{ survivors: T[]; skipped: number }> {
  if (entries.length === 0) return { survivors: [], skipped: 0 };

  const { data: existing, error } = await supabase
    .from("opportunities")
    .select("normalized_url, normalized_title, category");
  if (error) throw error;

  const existingUrls = new Set((existing ?? []).map((r) => r.normalized_url));
  const existingTitlesByCategory = new Map<string, string[]>();
  for (const row of existing ?? []) {
    const list = existingTitlesByCategory.get(row.category) ?? [];
    list.push(row.normalized_title);
    existingTitlesByCategory.set(row.category, list);
  }

  const survivors: T[] = [];
  let skipped = 0;

  const seenUrlsThisBatch = new Set<string>();
  const seenTitlesThisBatch = new Map<string, string[]>();

  for (const entry of entries) {
    const { candidate } = entry;
    const normUrl = normalizeUrl(candidate.url);
    const normTitle = normalizeTitle(candidate.title);

    if (existingUrls.has(normUrl) || seenUrlsThisBatch.has(normUrl)) {
      skipped++;
      continue;
    }

    const existingTitles = existingTitlesByCategory.get(candidate.category) ?? [];
    const batchTitles = seenTitlesThisBatch.get(candidate.category) ?? [];
    const candidateTitles = [...existingTitles, ...batchTitles];

    if (candidateTitles.length > 0) {
      const { bestMatch } = stringSimilarity.findBestMatch(normTitle, candidateTitles);
      if (bestMatch.rating >= FUZZY_THRESHOLD) {
        skipped++;
        continue;
      }
    }

    seenUrlsThisBatch.add(normUrl);
    seenTitlesThisBatch.set(candidate.category, [...batchTitles, normTitle]);
    survivors.push(entry);
  }

  return { survivors, skipped };
}
