import "server-only";
import stringSimilarity from "string-similarity";

// Below this, titles aren't similar enough to be worth a human glance.
// At/above 0.85, the discovery pipeline's own dedup (src/lib/discovery/
// dedup.ts) already blocks it from ever reaching the queue — so anything
// surfaced here is specifically the "close but not auto-blocked" band.
const NEAR_MISS_MIN = 0.6;
const NEAR_MISS_MAX = 0.85;

export interface NearDuplicateMatch {
  matchId: string;
  matchTitle: string;
  matchStatus: "pending" | "approved";
  score: number;
}

export interface TitledRow {
  id: string;
  title: string;
  category: string;
  status: "pending" | "approved" | "rejected";
}

function normalizeTitle(raw: string): string {
  return raw.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * For each pending row, finds its best-scoring title match among every
 * other pending/approved row in the same category, keyed by pending row
 * id. Only returns a match when the score lands in the "worth a human
 * glance" band described above.
 */
export function findNearDuplicates(rows: TitledRow[]): Map<string, NearDuplicateMatch> {
  const byCategory = new Map<string, TitledRow[]>();
  for (const row of rows) {
    if (row.status === "rejected") continue;
    const list = byCategory.get(row.category) ?? [];
    list.push(row);
    byCategory.set(row.category, list);
  }

  const result = new Map<string, NearDuplicateMatch>();

  for (const categoryRows of byCategory.values()) {
    if (categoryRows.length < 2) continue;
    const pendingInCategory = categoryRows.filter((r) => r.status === "pending");

    for (const target of pendingInCategory) {
      const others = categoryRows.filter((r) => r.id !== target.id);
      if (others.length === 0) continue;

      const targetNorm = normalizeTitle(target.title);
      const otherTitles = others.map((r) => normalizeTitle(r.title));
      const { bestMatch, bestMatchIndex } = stringSimilarity.findBestMatch(
        targetNorm,
        otherTitles
      );

      if (bestMatch.rating >= NEAR_MISS_MIN && bestMatch.rating < NEAR_MISS_MAX) {
        const matched = others[bestMatchIndex];
        result.set(target.id, {
          matchId: matched.id,
          matchTitle: matched.title,
          matchStatus: matched.status as "pending" | "approved",
          score: bestMatch.rating,
        });
      }
    }
  }

  return result;
}
