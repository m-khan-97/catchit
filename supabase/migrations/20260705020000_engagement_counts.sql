-- Community signal (roadmap Tier 3): lightweight "N students saved / M
-- applied" counts per opportunity for social proof. Same pattern as
-- get_application_stats() — saved_opportunities RLS is per-user, so a
-- public aggregate needs a security-definer function; it returns only
-- grouped counts, never row contents, so it's safe for anon/authenticated.
create or replace function get_save_counts()
returns table (opportunity_id uuid, saved_count bigint, applied_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    opportunity_id,
    count(*) as saved_count,
    count(*) filter (where status in ('applied', 'got_it', 'no_luck')) as applied_count
  from saved_opportunities
  group by opportunity_id;
$$;
