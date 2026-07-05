import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapWithConcurrency } from "@/lib/concurrency";
import { sendEmail } from "./resend";
import { newMatchesEmail } from "./templates";
import { sendPush, type PushTarget } from "@/lib/push";
import { matchesFilter } from "@/lib/opportunities/filters";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PublicOpportunity } from "@/lib/supabase/types";

const CONCURRENCY = 5;

export interface NewMatchAlertSummary {
  filtersChecked: number;
  usersNotified: number;
  emailsSent: number;
  emailsFailed: number;
  pushSent: number;
  pushFailed: number;
}

type AdminClient = SupabaseClient<Database>;

async function notifyPush(
  supabase: AdminClient,
  targets: PushTarget[],
  payload: { title: string; body: string; url: string }
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  await mapWithConcurrency(targets, CONCURRENCY, async (target) => {
    const result = await sendPush(target, payload);
    if (result.ok) {
      sent++;
    } else {
      failed++;
      if (result.expired) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", target.endpoint);
      }
    }
  });

  return { sent, failed };
}

/**
 * Daily check: for every followed filter, find opportunities approved
 * since that filter's last check and matching its category/region/audience
 * tags, then email (and best-effort push) one combined digest per user —
 * never one message per filter, even if a user follows several. The
 * watermark is captured once at the start of the run and advanced for
 * every filter checked (matched or not), so nothing is ever double-sent
 * and nothing approved mid-run is missed by an earlier watermark.
 */
export async function runNewMatchAlerts(): Promise<NewMatchAlertSummary> {
  const supabase = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const runStartIso = new Date().toISOString();
  const nowIso = runStartIso;

  const empty: NewMatchAlertSummary = {
    filtersChecked: 0,
    usersNotified: 0,
    emailsSent: 0,
    emailsFailed: 0,
    pushSent: 0,
    pushFailed: 0,
  };

  const { data: filters, error: filtersError } = await supabase.from("followed_filters").select("*");
  if (filtersError) throw filtersError;
  if (!filters || filters.length === 0) return empty;

  const earliestWatermark = filters.reduce(
    (min, f) => (f.last_alerted_at < min ? f.last_alerted_at : min),
    filters[0].last_alerted_at
  );

  const { data: candidateRows, error: candidatesError } = await supabase
    .from("opportunities")
    .select(
      "id,title,organization,category,snippet,description,eligibility,url,deadline,deadline_note,region_tags,audience_tags,source,discovered_at,reviewed_at"
    )
    .eq("status", "approved")
    .gt("reviewed_at", earliestWatermark)
    .or(`deadline.is.null,deadline.gte.${nowIso}`);
  if (candidatesError) throw candidatesError;

  const candidates = (candidateRows ?? []) as (PublicOpportunity & { reviewed_at: string | null })[];

  // Batch email lookups per unique user (Auth admin API, not a data table).
  const userIds = [...new Set(filters.map((f) => f.user_id))];
  const emailByUserId = new Map<string, string>();
  await mapWithConcurrency(userIds, CONCURRENCY, async (userId) => {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (!error && data.user?.email) emailByUserId.set(userId, data.user.email);
  });

  const { data: pushRows } = await supabase.from("push_subscriptions").select("*").in("user_id", userIds);
  const pushTargetsByUserId = new Map<string, PushTarget[]>();
  for (const p of pushRows ?? []) {
    const list = pushTargetsByUserId.get(p.user_id) ?? [];
    list.push({ endpoint: p.endpoint, p256dh: p.p256dh, auth: p.auth });
    pushTargetsByUserId.set(p.user_id, list);
  }

  // Union matched opportunities per user across all their filters, then
  // send one email/push per user, not one per filter.
  const matchedByUserId = new Map<string, Map<string, PublicOpportunity>>();
  for (const filter of filters) {
    if (candidates.length === 0) continue;
    const matches = candidates.filter((o) => filter.last_alerted_at < o.reviewed_at! && matchesFilter(o, filter));
    if (matches.length === 0) continue;

    const userMatches = matchedByUserId.get(filter.user_id) ?? new Map<string, PublicOpportunity>();
    for (const o of matches) userMatches.set(o.id, o);
    matchedByUserId.set(filter.user_id, userMatches);
  }

  let emailsSent = 0;
  let emailsFailed = 0;
  let pushSent = 0;
  let pushFailed = 0;

  await mapWithConcurrency([...matchedByUserId.entries()], CONCURRENCY, async ([userId, matchesMap]) => {
    const email = emailByUserId.get(userId);
    const items = [...matchesMap.values()].sort((a, b) => a.title.localeCompare(b.title));

    if (email) {
      const { subject, html } = newMatchesEmail(items, siteUrl);
      const result = await sendEmail({ to: email, subject, html });
      if (result.ok) emailsSent++;
      else {
        emailsFailed++;
        console.error(`New-match alert failed for ${email}: ${result.error}`);
      }
    }

    const targets = pushTargetsByUserId.get(userId) ?? [];
    if (targets.length > 0) {
      const { sent, failed } = await notifyPush(supabase, targets, {
        title: `${items.length} new opportunit${items.length === 1 ? "y" : "ies"} match your filters`,
        body: items[0].title,
        url: `${siteUrl}/`,
      });
      pushSent += sent;
      pushFailed += failed;
    }
  });

  // Advance every checked filter's watermark, regardless of whether it matched anything this run.
  await mapWithConcurrency(filters, CONCURRENCY, async (filter) => {
    await supabase.from("followed_filters").update({ last_alerted_at: runStartIso }).eq("id", filter.id);
  });

  return {
    filtersChecked: filters.length,
    usersNotified: matchedByUserId.size,
    emailsSent,
    emailsFailed,
    pushSent,
    pushFailed,
  };
}
