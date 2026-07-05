-- Instant new-match alerts on followed filters (roadmap Tier 2): a
-- watermark per filter so the daily cron only alerts on opportunities
-- reviewed (approved) since the last check, never the whole backlog.
-- Defaults to now() so existing filters don't get a retroactive dump of
-- every already-approved item on the first run.
alter table followed_filters
  add column last_alerted_at timestamptz not null default now();
