-- Application status tracking on saved items (roadmap Phase 3 tier-1):
-- saved -> applied -> got_it / no_luck. Generates a real, self-reported
-- "N applications, M successes" outcome metric, not just a save count.

alter table saved_opportunities
  add column status text not null default 'saved',
  add column status_updated_at timestamptz not null default now();

alter table saved_opportunities
  add constraint saved_opportunities_status_check
  check (status in ('saved', 'applied', 'got_it', 'no_luck'));

-- Users could already select/insert/delete their own saved rows but had no
-- way to update one — needed now so a user can move a saved item through
-- the status states without unsaving and resaving it.
create policy "users update own saved opportunities"
  on saved_opportunities for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Site-wide application outcome counts for the public /stats page.
-- saved_opportunities RLS is per-user (select own rows only), so a public
-- aggregate needs a security-definer function — it returns only counts,
-- never any row contents, so it's safe to expose to anon/authenticated alike.
create or replace function get_application_stats()
returns table (applied bigint, got_it bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*) filter (where status in ('applied', 'got_it', 'no_luck')) as applied,
    count(*) filter (where status = 'got_it') as got_it
  from saved_opportunities;
$$;
