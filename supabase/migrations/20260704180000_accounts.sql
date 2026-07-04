-- Light, optional user accounts (roadmap Phase 3a): magic-link login,
-- saved opportunities, followed filters. Browsing stays fully login-free —
-- this is purely additive and doesn't touch the opportunities table itself.

-- profiles: one row per authenticated user, auto-created on signup. Holds
-- the capability token for that user's personalized calendar feed.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  calendar_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now()
);

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- saved_opportunities: a user's bookmarked items.
create table saved_opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  opportunity_id uuid not null references opportunities (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, opportunity_id)
);

-- followed_filters: saved filter combos, e.g. "scholarships · UK ·
-- students". Empty array on an axis = "all" for that axis, matching the
-- feed's own filter semantics.
create table followed_filters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  categories text[] not null default '{}',
  regions text[] not null default '{}',
  audiences text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index saved_opportunities_user_idx on saved_opportunities (user_id);
create index followed_filters_user_idx on followed_filters (user_id);

alter table profiles enable row level security;
alter table saved_opportunities enable row level security;
alter table followed_filters enable row level security;

-- Users manage only their own rows — a real per-user RLS model, unlike
-- every other table so far (which is deny-all-anon, admin/service-role
-- only). The profiles insert has no policy at all: the trigger above runs
-- `security definer`, so it bypasses RLS rather than needing one.

create policy "users select own profile"
  on profiles for select
  to authenticated
  using (id = auth.uid());

create policy "users update own profile"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "users select own saved opportunities"
  on saved_opportunities for select
  to authenticated
  using (user_id = auth.uid());

create policy "users insert own saved opportunities"
  on saved_opportunities for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "users delete own saved opportunities"
  on saved_opportunities for delete
  to authenticated
  using (user_id = auth.uid());

create policy "users select own followed filters"
  on followed_filters for select
  to authenticated
  using (user_id = auth.uid());

create policy "users insert own followed filters"
  on followed_filters for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "users update own followed filters"
  on followed_filters for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users delete own followed filters"
  on followed_filters for delete
  to authenticated
  using (user_id = auth.uid());
