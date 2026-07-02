import { createClient } from "@/lib/supabase/server";
import { sanitizeSearchTerm } from "@/lib/opportunities/search";
import type { OpportunityCategory, PublicOpportunity } from "./types";

const CATEGORY_VALUES = new Set<string>([
  "hackathon",
  "voucher",
  "event",
  "scholarship",
  "internship",
  "conference",
  "journal",
  "other",
]);

export interface FeedFilters {
  category?: string;
  region?: string;
  audience?: string;
  q?: string;
}

/**
 * Approved, not-yet-expired opportunities, soonest deadline first and
 * ongoing (no deadline) items last — the whole point of the feed is
 * deadlines, not recency.
 */
export async function getFeed(filters: FeedFilters): Promise<PublicOpportunity[]> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  let query = supabase
    .from("opportunities_public")
    .select("*")
    .or(`deadline.is.null,deadline.gte.${nowIso}`)
    .order("deadline", { ascending: true, nullsFirst: false });

  if (filters.category && filters.category !== "all" && CATEGORY_VALUES.has(filters.category)) {
    query = query.eq("category", filters.category as OpportunityCategory);
  }
  if (filters.region && filters.region !== "all") {
    query = query.contains("region_tags", [filters.region]);
  }
  if (filters.audience && filters.audience !== "all") {
    query = query.contains("audience_tags", [filters.audience]);
  }
  if (filters.q) {
    const q = sanitizeSearchTerm(filters.q);
    if (q) {
      query = query.or(`title.ilike.%${q}%,organization.ilike.%${q}%,snippet.ilike.%${q}%`);
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getOpportunityById(id: string): Promise<PublicOpportunity | null> {
  if (!UUID_RE.test(id)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities_public")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export interface FeedStats {
  total: number;
  live: number;
  closingSoon: number;
  sources: number;
}

export async function getStats(): Promise<FeedStats> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const weekAheadIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const [totalRes, liveRes, closingSoonRes, sourcesRes] = await Promise.all([
    supabase.from("opportunities_public").select("*", { count: "exact", head: true }),
    supabase
      .from("opportunities_public")
      .select("*", { count: "exact", head: true })
      .or(`deadline.is.null,deadline.gte.${nowIso}`),
    supabase
      .from("opportunities_public")
      .select("*", { count: "exact", head: true })
      .gte("deadline", nowIso)
      .lte("deadline", weekAheadIso),
    supabase.from("opportunities_public").select("source"),
  ]);

  if (totalRes.error) throw totalRes.error;
  if (liveRes.error) throw liveRes.error;
  if (closingSoonRes.error) throw closingSoonRes.error;
  if (sourcesRes.error) throw sourcesRes.error;

  const sources = new Set((sourcesRes.data ?? []).map((r) => r.source));

  return {
    total: totalRes.count ?? 0,
    live: liveRes.count ?? 0,
    closingSoon: closingSoonRes.count ?? 0,
    sources: sources.size,
  };
}
