-- Weekly digest subscribers. Deliberately independent of `opportunities`
-- (per the original plan: adding this table must not touch that one) and
-- of any future user-accounts system — a digest subscription is just an
-- email + filter preferences + two capability tokens.

create table subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,

  -- Filter preferences; empty array = "all" for that axis.
  categories text[] not null default '{}',
  regions text[] not null default '{}',
  audiences text[] not null default '{}',

  -- Capability tokens: possession of the token *is* the authorization,
  -- so confirm/unsubscribe links work with no login. Unguessable uuids.
  confirm_token uuid not null default gen_random_uuid(),
  unsubscribe_token uuid not null default gen_random_uuid(),

  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create index subscribers_confirmed_idx on subscribers (confirmed_at)
  where confirmed_at is not null;

-- No anon/authenticated access at all: every read and write goes through
-- server-side code using the service role (signup action, confirm and
-- unsubscribe routes, digest cron). RLS on with no policies = deny-all
-- for anon; service role bypasses RLS.
alter table subscribers enable row level security;
