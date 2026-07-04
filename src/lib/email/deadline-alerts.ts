import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapWithConcurrency } from "@/lib/concurrency";
import { sendEmail } from "./resend";
import { deadlineReminderEmail } from "./templates";

const CONCURRENCY = 5;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

export interface DeadlineAlertSummary {
  candidates7d: number;
  candidates48h: number;
  sent: number;
  failed: number;
}

/**
 * Scans saved opportunities for two reminder windows — 7 days and 48 hours
 * before deadline — and emails the saver once per window. If an item is
 * saved when it's already within 48h of closing, only the 48h reminder
 * fires; sending a "closes in a week" email for something due tomorrow
 * would just be wrong, not merely redundant.
 */
export async function runDeadlineAlerts(): Promise<DeadlineAlertSummary> {
  const supabase = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const now = Date.now();
  const sevenDaysAheadMs = now + SEVEN_DAYS_MS;
  const fortyEightHoursAheadMs = now + FORTY_EIGHT_HOURS_MS;

  const { data: savedRows, error: savedError } = await supabase
    .from("saved_opportunities")
    .select("*")
    .or("reminder_7d_sent_at.is.null,reminder_48h_sent_at.is.null");
  if (savedError) throw savedError;

  const rows = savedRows ?? [];
  if (rows.length === 0) {
    return { candidates7d: 0, candidates48h: 0, sent: 0, failed: 0 };
  }

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
  if (oppById.size === 0) {
    return { candidates7d: 0, candidates48h: 0, sent: 0, failed: 0 };
  }

  // Batch email lookups per unique user (Auth admin API, not a data table).
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const emailByUserId = new Map<string, string>();
  await mapWithConcurrency(userIds, CONCURRENCY, async (userId) => {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (!error && data.user?.email) emailByUserId.set(userId, data.user.email);
  });

  let sent = 0;
  let failed = 0;
  let candidates7d = 0;
  let candidates48h = 0;

  await mapWithConcurrency(rows, CONCURRENCY, async (row) => {
    const opportunity = oppById.get(row.opportunity_id);
    if (!opportunity || !opportunity.deadline) return;

    const email = emailByUserId.get(row.user_id);
    if (!email) return;

    const deadlineMs = new Date(opportunity.deadline).getTime();

    if (!row.reminder_48h_sent_at && deadlineMs <= fortyEightHoursAheadMs) {
      candidates48h++;
      const { subject, html } = deadlineReminderEmail(opportunity, "48h", siteUrl);
      const result = await sendEmail({ to: email, subject, html });
      if (result.ok) {
        sent++;
        await supabase
          .from("saved_opportunities")
          .update({ reminder_48h_sent_at: new Date().toISOString() })
          .eq("id", row.id);
      } else {
        failed++;
        console.error(`48h reminder failed for ${email}: ${result.error}`);
      }
      return; // don't also send the 7d reminder for the same item in the same run
    }

    if (
      !row.reminder_7d_sent_at &&
      deadlineMs <= sevenDaysAheadMs &&
      deadlineMs > fortyEightHoursAheadMs
    ) {
      candidates7d++;
      const { subject, html } = deadlineReminderEmail(opportunity, "7d", siteUrl);
      const result = await sendEmail({ to: email, subject, html });
      if (result.ok) {
        sent++;
        await supabase
          .from("saved_opportunities")
          .update({ reminder_7d_sent_at: new Date().toISOString() })
          .eq("id", row.id);
      } else {
        failed++;
        console.error(`7d reminder failed for ${email}: ${result.error}`);
      }
    }
  });

  return { candidates7d, candidates48h, sent, failed };
}
