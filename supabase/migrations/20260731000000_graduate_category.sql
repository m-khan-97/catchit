-- New top-level category: graduate programmes — structured graduate schemes
-- and graduate-entry roles, as distinct from `internship` (short, in-study)
-- and `academic` (research posts). Requested by a university careers team:
-- these carry hard deadlines set months ahead and are the highest-stakes
-- application a final-year student makes.
--
-- Postgres requires ADD VALUE to run as its own statement, not combined
-- with anything that uses the new value in the same transaction — this
-- migration does nothing else, so it's safe to run as-is.
alter type opportunity_category add value 'graduate';
