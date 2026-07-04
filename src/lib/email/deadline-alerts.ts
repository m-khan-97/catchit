import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapWithConcurrency } from "@/lib/concurrency";
import { sendEmail } from "./resend";
import { deadlineReminderEmail } from "./templates";
import { sendPush, type PushTarget } from "@/lib/push";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PublicOpportunity } from "@/lib/supabase/types";

const CONCURRENCY = 5;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

export interface DeadlineAlertSummary {
  candidates7d: number;
  candidates48h: number;
  sent: number;
  failed: number;
  pushSent: number;
  pushFailed: number;
}

type AdminClient = SupabaseClient<Database>;

/** Best-effort: pushes to every subscription for this user, deleting any the push service reports as gone (404/410). */
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
      } else {
        console.error(`Push failed for ${target.endpoint}: ${result.error}`);
      }
    }
  });

  return { sent, failed };
}

/**
 * Scans saved opportunities for two reminder windows — 7 days and 48 hours
 * before deadline — and emails (plus, best-effort, pushes to) the saver
 * once per window. If an item is saved when it's already within 48h of
 * closing, only the 48h reminder fires; sending a "closes in a week" email
 * for something due tomorrow would just be wrong, not merely redundant.
 */
export async function runDeadlineAlerts(): Promise<DeadlineAlertSummary> {
  const supabase = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const now = Date.now();
  const sevenDaysAheadMs = now + SEVEN_DAYS_MS;
  const fortyEightHoursAheadMs = now + FORTY_EIGHT_HOURS_MS;

  const empty: DeadlineAlertSummary = {
    candidates7d: 0,
    candidates48h: 0,
    sent: 0,
    failed: 0,
    pushSent: 0,
    pushFailed: 0,
  };

  const { data: savedRows, error: savedError } = await supabase
    .from("saved_opportunities")
    .select("*")
    .or("reminder_7d_sent_at.is.null,reminder_48h_sent_at.is.null");
  if (savedError) throw savedError;

  const rows = savedRows ?? [];
  if (rows.length === 0) return empty;

  const opportunityIds = [...new Set(rows.map((r) => r.opportunity_id))];
  const { data: opportunities, error: oppError } = await supabase
    .from("opportunities_public")
    .select("*")
    .in("id", opportunityIds)
    .not("deadline", "is", null)
    .gte("deadline", new Date(now).toISOString())
    .lte("deadline", new Date(sevenDaysAheadMs).toISOString());
  if (oppError) throw oppError;

  const oppById = new Map((opportunities ?? []).map((o) => [o.id, o]));
  if (oppById.size === 0) return empty;

  // Batch email lookups per unique user (Auth admin API, not a data table).
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const emailByUserId = new Map<string, string>();
  await mapWithConcurrency(userIds, CONCURRENCY, async (userId) => {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (!error && data.user?.email) emailByUserId.set(userId, data.user.email);
  });

  const { data: pushRows } = await supabase
    .from("push_subscriptions")
    .select("*")
    .in("user_id", userIds);
  const pushTargetsByUserId = new Map<string, PushTarget[]>();
  for (const p of pushRows ?? []) {
    const list = pushTargetsByUserId.get(p.user_id) ?? [];
    list.push({ endpoint: p.endpoint, p256dh: p.p256dh, auth: p.auth });
    pushTargetsByUserId.set(p.user_id, list);
  }

  let sent = 0;
  let failed = 0;
  let pushSent = 0;
  let pushFailed = 0;
  let candidates7d = 0;
  let candidates48h = 0;

  async function fireReminder(
    row: (typeof rows)[number],
    opportunity: PublicOpportunity,
    urgency: "7d" | "48h",
    email: string
  ) {
    const { subject, html } = deadlineReminderEmail(opportunity, urgency, siteUrl);
    const result = await sendEmail({ to: email, subject, html });

    if (result.ok) {
      sent++;
      const update =
        urgency === "48h"
          ? { reminder_48h_sent_at: new Date().toISOString() }
          : { reminder_7d_sent_at: new Date().toISOString() };
      await supabase.from("saved_opportunities").update(update).eq("id", row.id);
    } else {
      failed++;
      console.error(`${urgency} reminder failed for ${email}: ${result.error}`);
    }

    const targets = pushTargetsByUserId.get(row.user_id) ?? [];
    if (targets.length > 0) {
      const headline = urgency === "48h" ? "Closes in 48 hours" : "Closes in a week";
      const { sent: ps, failed: pf } = await notifyPush(supabase, targets, {
        title: headline,
        body: opportunity.title,
        url: `${siteUrl}/opportunity/${opportunity.id}`,
      });
      pushSent += ps;
      pushFailed += pf;
    }
  }

  await mapWithConcurrency(rows, CONCURRENCY, async (row) => {
    const opportunity = oppById.get(row.opportunity_id);
    if (!opportunity || !opportunity.deadline) return;

    const email = emailByUserId.get(row.user_id);
    if (!email) return;

    const deadlineMs = new Date(opportunity.deadline).getTime();

    if (!row.reminder_48h_sent_at && deadlineMs <= fortyEightHoursAheadMs) {
      candidates48h++;
      await fireReminder(row, opportunity, "48h", email);
      return; // don't also send the 7d reminder for the same item in the same run
    }

    if (
      !row.reminder_7d_sent_at &&
      deadlineMs <= sevenDaysAheadMs &&
      deadlineMs > fortyEightHoursAheadMs
    ) {
      candidates7d++;
      await fireReminder(row, opportunity, "7d", email);
    }
  });

  return { candidates7d, candidates48h, sent, failed, pushSent, pushFailed };
}
