import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ExpirySweepSummary {
  expired: number;
}

/**
 * Rejects pending opportunities whose deadline passed while they sat in the
 * review queue.
 *
 * The discovery schema already refuses to *insert* an already-past deadline
 * (see schema.ts), but nothing catches one that goes stale afterwards. Left
 * alone the queue fills with items nobody can act on — and because the
 * near-duplicate scan compares each pending row against every other pending
 * row in its category, a large stale queue also inflates its own duplicate
 * warnings and makes the admin page slower.
 *
 * Rejected rather than deleted on purpose: dedup checks rows of every
 * status, so a rejected row keeps blocking re-discovery of the same
 * opportunity. Deleting would let the next run rediscover it.
 *
 * Rows with a null deadline are never touched — `deadline < now()` is null
 * (not true) for them, so they're excluded by the comparison itself. Those
 * are genuinely ongoing opportunities and need a human decision.
 */
export async function sweepExpiredPending(): Promise<ExpirySweepSummary> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("opportunities")
    .update({ status: "rejected" })
    .eq("status", "pending")
    .lt("deadline", new Date().toISOString())
    .select("id");
  if (error) throw error;

  return { expired: data?.length ?? 0 };
}
