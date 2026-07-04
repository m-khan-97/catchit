-- Deadline alerts (roadmap Phase 3b): T-7d/T-48h email reminders for saved
-- opportunities. Two nullable timestamps track what's already been sent so
-- the daily cron doesn't re-notify on every run once a window is entered.

alter table saved_opportunities
  add column reminder_7d_sent_at timestamptz,
  add column reminder_48h_sent_at timestamptz;
