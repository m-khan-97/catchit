-- Public success stories (roadmap: user-stories wall). Same trust model as
-- opportunities: anon can INSERT (submissions), only admins can read
-- pending rows or change status; the public reads approved rows via a
-- dedicated view.

create table stories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_line text not null default '',
  story text not null,
  opportunity_url text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,

  constraint stories_name_not_blank check (length(trim(name)) > 0),
  constraint stories_story_not_blank check (length(trim(story)) > 0)
);

create index stories_status_idx on stories (status);
create index stories_submitted_at_idx on stories (submitted_at desc);

alter table stories enable row level security;

-- Anyone may submit a pending story; nobody anon/authenticated may read
-- the base table directly (it's the same "insert-only, narrow check"
-- shape as the opportunities user-submission policy).
create policy "anyone can submit stories"
  on stories for insert
  to anon, authenticated
  with check (status = 'pending' and reviewed_at is null);

create policy "admins select stories"
  on stories for select
  to authenticated
  using (is_admin());

create policy "admins update stories"
  on stories for update
  to authenticated
  using (is_admin())
  with check (is_admin());

-- Public read surface: approved rows only, no status/review internals.
create view stories_public
  with (security_invoker = false) as
select id, name, role_line, story, opportunity_url, submitted_at
from stories
where status = 'approved';

grant select on stories_public to anon, authenticated;
