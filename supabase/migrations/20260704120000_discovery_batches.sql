-- Tracks in-flight Anthropic Message Batches for the AI-search portion of
-- discovery. Batches process asynchronously (usually within an hour, up to
-- 24h) at half the synchronous price, so a run submits a batch and finishes
-- immediately; a separate collect cron polls this table and finalizes the
-- parent discovery_runs row once results are ready.

create table discovery_batches (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references discovery_runs (id) on delete cascade,
  batch_id text not null,
  -- { [custom_id]: { category, query } } — maps batch results back to what was asked.
  task_map jsonb not null,
  status text not null default 'submitted', -- submitted | collected | failed
  created_at timestamptz not null default now(),
  collected_at timestamptz
);

create index discovery_batches_pending_idx on discovery_batches (created_at)
  where status = 'submitted';

-- Same pattern as every other internal table: RLS on, no policies at all —
-- deny-all for anon/authenticated, service role (the cron jobs) bypasses RLS.
alter table discovery_batches enable row level security;
