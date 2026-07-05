import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapWithConcurrency } from "@/lib/concurrency";
import { sendEmail } from "./resend";
import { digestEmail } from "./templates";
import { matchesFilter } from "@/lib/opportunities/filters";

const SEND_CONCURRENCY = 5;
const MAX_ITEMS_PER_SECTION = 8;

export interface DigestRunSummary {
  subscribers: number;
  sent: number;
  skippedEmpty: number;
  failed: number;
}

export async function runDigest(): Promise<DigestRunSummary> {
  const supabase = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const nowIso = new Date().toISOString();
  const weekAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const weekAheadIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const [subsRes, closingRes, newRes] = await Promise.all([
    supabase.from("subscribers").select("*").not("confirmed_at", "is", null),
    supabase
      .from("opportunities_public")
      .select("*")
      .gte("deadline", nowIso)
      .lte("deadline", weekAheadIso)
      .order("deadline", { ascending: true }),
    supabase
      .from("opportunities_public")
      .select("*")
      .gte("discovered_at", weekAgoIso)
      .or(`deadline.is.null,deadline.gte.${nowIso}`)
      .order("deadline", { ascending: true, nullsFirst: false }),
  ]);

  if (subsRes.error) throw subsRes.error;
  if (closingRes.error) throw closingRes.error;
  if (newRes.error) throw newRes.error;

  const subscribers = subsRes.data ?? [];
  const closingSoonAll = closingRes.data ?? [];
  // Don't repeat an item in "new" when it's already in "closing soon".
  const closingIds = new Set(closingSoonAll.map((o) => o.id));
  const newThisWeekAll = (newRes.data ?? []).filter((o) => !closingIds.has(o.id));

  let sent = 0;
  let skippedEmpty = 0;
  let failed = 0;

  await mapWithConcurrency(subscribers, SEND_CONCURRENCY, async (sub) => {
    const closingSoon = closingSoonAll.filter((o) => matchesFilter(o, sub)).slice(0, MAX_ITEMS_PER_SECTION);
    const newThisWeek = newThisWeekAll.filter((o) => matchesFilter(o, sub)).slice(0, MAX_ITEMS_PER_SECTION);

    if (closingSoon.length === 0 && newThisWeek.length === 0) {
      // Nothing matched their filters this week — sending an empty email
      // trains people to ignore (or report) the digest. Skip.
      skippedEmpty++;
      return;
    }

    const unsubscribeUrl = `${siteUrl}/digest/unsubscribe?token=${sub.unsubscribe_token}`;
    const { subject, html } = digestEmail({ closingSoon, newThisWeek }, unsubscribeUrl, siteUrl);
    const result = await sendEmail({ to: sub.email, subject, html });

    if (result.ok) sent++;
    else {
      failed++;
      console.error(`Digest send failed for ${sub.email}: ${result.error}`);
    }
  });

  return { subscribers: subscribers.length, sent, skippedEmpty, failed };
}
