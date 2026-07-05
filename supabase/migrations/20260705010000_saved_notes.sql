-- Free-text notes on saved items (roadmap Tier 2), e.g. "need 2
-- recommenders" or "essay due before the listed deadline" — a place for
-- context the structured status field can't capture.

alter table saved_opportunities
  add column note text not null default '';
