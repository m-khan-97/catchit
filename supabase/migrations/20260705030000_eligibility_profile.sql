-- Eligibility profile (roadmap Tier 2 — the honest, zero-cost version of
-- "for you" ranking, §3d): a one-time audience/region preference so the
-- feed can badge "✓ Matches you" via simple tag overlap. Empty array =
-- no preference set, matching the same semantics followed_filters already
-- uses.
alter table profiles
  add column preferred_audience text[] not null default '{}',
  add column preferred_regions text[] not null default '{}';
