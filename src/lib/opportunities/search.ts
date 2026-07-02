/**
 * Strips characters that are structurally significant in PostgREST's
 * comma-separated `or()` filter syntax (`,`, `(`, `)`), so a search term
 * containing them can't break out of the intended ilike condition or
 * inject extra filter clauses. Also caps length as a basic abuse guard.
 */
export function sanitizeSearchTerm(raw: string): string {
  return raw.replace(/[,()]/g, " ").trim().slice(0, 100);
}
