-- New top-level category: academic research posts — funded PhD studentships,
-- postdoctoral positions, and research fellowships. Kept as one category
-- rather than three because they share an audience (people moving through
-- an academic career) and the same decisive filter: is it actually funded,
-- and am I eligible for that funding?
--
-- Postgres requires ADD VALUE to run as its own statement, not combined
-- with anything that uses the new value in the same transaction — this
-- migration does nothing else, so it's safe to run as-is.
alter type opportunity_category add value 'academic';
