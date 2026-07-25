-- New top-level category: startup pitch/grant opportunities (pitch
-- competitions, accelerator applications, innovation/enterprise grants).
-- Postgres requires ADD VALUE to run as its own statement, not combined
-- with anything that uses the new value in the same transaction — this
-- migration does nothing else, so it's safe to run as-is.
alter type opportunity_category add value 'startup';
