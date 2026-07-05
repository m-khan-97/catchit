export interface TaggedOpportunity {
  category: string;
  region_tags: string[];
  audience_tags: string[];
}

export interface FilterLike {
  categories: string[];
  regions: string[];
  audiences: string[];
}

/** Empty array on an axis = "all" for that axis — the shared semantics
 * behind followed filters, digest preferences, and the personal calendar. */
export function matchesFilter(o: TaggedOpportunity, f: FilterLike): boolean {
  if (f.categories.length > 0 && !f.categories.includes(o.category)) return false;
  if (f.regions.length > 0 && !o.region_tags.some((r) => f.regions.includes(r))) return false;
  if (f.audiences.length > 0 && !o.audience_tags.some((a) => f.audiences.includes(a))) return false;
  return true;
}

export interface PreferenceLike {
  preferred_audience: string[];
  preferred_regions: string[];
}

/**
 * "✓ Matches you" badge check — true only if the user has actually set a
 * preference AND it overlaps. No preferences set = no badge, not a
 * trivially-true match.
 */
export function matchesPreferences(o: TaggedOpportunity, p: PreferenceLike): boolean {
  if (p.preferred_audience.length === 0 && p.preferred_regions.length === 0) return false;
  const audienceOk =
    p.preferred_audience.length === 0 || o.audience_tags.some((a) => p.preferred_audience.includes(a));
  const regionOk =
    p.preferred_regions.length === 0 || o.region_tags.some((r) => p.preferred_regions.includes(r));
  return audienceOk && regionOk;
}
