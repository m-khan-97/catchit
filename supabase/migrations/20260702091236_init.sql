-- CatchIt initial schema: opportunities feed, discovery run log, admin allowlist.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type opportunity_category as enum (
  'hackathon', 'voucher', 'event', 'scholarship',
  'internship', 'conference', 'journal', 'other'
);

create type opportunity_status as enum ('pending', 'approved', 'rejected');

create type opportunity_link_status as enum ('ok', 'broken', 'unchecked');

-- ---------------------------------------------------------------------------
-- Normalization helpers (dedup keys are derived, never entered by hand)
-- ---------------------------------------------------------------------------

create or replace function normalize_url(raw_url text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(lower(trim(raw_url)), '^https?://', ''),
        '^www\.', ''
      ),
      '[?#].*$', ''
    ),
    '/+$', ''
  );
$$;

create or replace function normalize_title(raw_title text)
returns text
language sql
immutable
as $$
  select regexp_replace(lower(trim(raw_title)), '\s+', ' ', 'g');
$$;

-- ---------------------------------------------------------------------------
-- admin_users: allowlist of named admin accounts (small shared review team)
-- ---------------------------------------------------------------------------

create table admin_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  created_at timestamptz not null default now()
);

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admin_users where id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- opportunities
-- ---------------------------------------------------------------------------

create table opportunities (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  organization text not null,
  category opportunity_category not null,
  snippet text not null,
  description text not null,
  eligibility text[] not null default '{}',

  url text not null,
  normalized_url text not null,

  deadline timestamptz,
  deadline_note text,

  region_tags text[] not null default '{}',
  audience_tags text[] not null default '{}',

  source text not null,
  status opportunity_status not null default 'pending',

  link_status opportunity_link_status not null default 'unchecked',
  last_checked_at timestamptz,

  discovered_at timestamptz not null default now(),
  reviewed_at timestamptz,

  submitter_email text,

  normalized_title text not null,

  constraint opportunities_title_not_blank check (length(trim(title)) > 0),
  constraint opportunities_url_not_blank check (length(trim(url)) > 0)
);

create or replace function opportunities_set_normalized_columns()
returns trigger
language plpgsql
as $$
begin
  new.normalized_url := normalize_url(new.url);
  new.normalized_title := normalize_title(new.title);
  return new;
end;
$$;

create trigger opportunities_normalize_before_write
  before insert or update of url, title on opportunities
  for each row
  execute function opportunities_set_normalized_columns();

-- Dedup: one row per canonical URL, regardless of status (rejected rows
-- must still block re-discovery of the same link).
create unique index opportunities_normalized_url_key on opportunities (normalized_url);

-- Fuzzy-title dedup scans candidates within a category; this index makes
-- that lookup cheap.
create index opportunities_category_normalized_title_idx
  on opportunities (category, normalized_title);

-- Feed queries: approved items sorted by deadline (soonest first, nulls/ongoing last).
create index opportunities_status_deadline_idx
  on opportunities (status, deadline);

create index opportunities_discovered_at_idx on opportunities (discovered_at desc);
create index opportunities_status_idx on opportunities (status);
create index opportunities_link_status_idx on opportunities (link_status)
  where link_status = 'broken';

-- ---------------------------------------------------------------------------
-- discovery_runs: one row per /api/cron/discover invocation
-- ---------------------------------------------------------------------------

create table discovery_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running', -- running | completed | failed
  source_counts jsonb not null default '{}', -- { devpost: {found,inserted,skipped,failed}, ... }
  found_count integer not null default 0,
  inserted_count integer not null default 0,
  skipped_count integer not null default 0,
  failed_count integer not null default 0,
  error_notes text
);

create index discovery_runs_started_at_idx on discovery_runs (started_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table opportunities enable row level security;
alter table discovery_runs enable row level security;
alter table admin_users enable row level security;

-- opportunities: no direct anon/authenticated SELECT on the base table (it
-- holds submitter_email). Public reads go through the opportunities_public
-- view below. Admins (authenticated + allowlisted) read/write the base
-- table directly for the review queue.

create policy "admins select all opportunities"
  on opportunities for select
  to authenticated
  using (is_admin());

create policy "admins update opportunities"
  on opportunities for update
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "admins insert opportunities"
  on opportunities for insert
  to authenticated
  with check (is_admin());

-- Public submission form: anon may insert only a pending, user-submitted row.
-- This is deliberately narrow so a direct PostgREST call can't smuggle in an
-- approved row or impersonate the automated pipeline as the source.
create policy "anon insert user-submitted pending opportunities"
  on opportunities for insert
  to anon
  with check (
    status = 'pending'
    and source = 'user-submitted'
    and link_status = 'unchecked'
    and reviewed_at is null
    and last_checked_at is null
  );

-- discovery_runs: admins can view run history; only the cron job (service
-- role, which bypasses RLS) writes to it.
create policy "admins select discovery runs"
  on discovery_runs for select
  to authenticated
  using (is_admin());

-- admin_users: admins can see the team roster; nothing else touches this
-- table (rows are added via the Supabase dashboard/CLI, not the app).
create policy "admins select admin roster"
  on admin_users for select
  to authenticated
  using (is_admin());

-- ---------------------------------------------------------------------------
-- Public view: safe columns only, approved rows only. This is what the
-- public site, JSON API, and calendar feed query with the anon key.
-- ---------------------------------------------------------------------------

create view opportunities_public
  with (security_invoker = false) as
select
  id, title, organization, category, snippet, description, eligibility,
  url, deadline, deadline_note, region_tags, audience_tags,
  source, discovered_at
from opportunities
where status = 'approved';

grant select on opportunities_public to anon, authenticated;
