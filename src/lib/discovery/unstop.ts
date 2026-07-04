import "server-only";
import type { Candidate } from "./schema";

// Unstop's public API backs their own site search — undocumented but
// stable and widely used by third-party aggregators. Covers hackathons,
// scholarships, and internships with genuinely structured fields (real
// registration deadlines, eligibility tags), unlike a scrape. Mostly
// India-skewed listings, but "online"/no country restriction means most
// are genuinely open to anyone — region_tags reflect that rather than
// excluding them; the admin queue is the real filter for relevance, same
// as every source.
//
// The "internships" endpoint is actually a combined jobs+internships
// board (195k+ total listings) — `subtypeFilter` discards anything whose
// `subtype` isn't literally "internships", so full-time roles (Sales
// Executive, Marketing Manager, etc.) never reach the internship category.
const OPPORTUNITY_TYPES = [
  { param: "hackathons", category: "hackathon" as const, subtypeFilter: null as string | null },
  { param: "scholarships", category: "scholarship" as const, subtypeFilter: null as string | null },
  { param: "internships", category: "internship" as const, subtypeFilter: "internships" },
];
const PER_PAGE = 20;
const USER_AGENT = "Mozilla/5.0 (compatible; CatchItBot/1.0)";

interface UnstopFilter {
  name: string;
  type: string;
}

interface UnstopOpportunity {
  title: string;
  public_url: string;
  region: string | null;
  location: string | null;
  overall_prizes: string | null;
  subtype: string | null;
  organisation: { name: string } | null;
  regnRequirements: {
    end_regn_dt: string | null;
    allowed_countries: string | null;
  } | null;
  seo_details?: { description: string }[];
  filters?: UnstopFilter[];
}

function regionTagsFor(o: UnstopOpportunity): string[] {
  let allowedCountries: string[] = [];
  try {
    allowedCountries = JSON.parse(o.regnRequirements?.allowed_countries ?? "[]");
  } catch {
    allowedCountries = [];
  }
  if (allowedCountries.length > 0) return allowedCountries;
  if (o.region === "online") return ["Remote", "Global"];
  return o.location ? [o.location] : [];
}

function eligibilityFor(o: UnstopOpportunity): string[] {
  return (o.filters ?? [])
    .filter((f) => f.type === "eligible")
    .map((f) => f.name)
    .slice(0, 6);
}

function buildSnippet(o: UnstopOpportunity, orgName: string): string {
  const parts: string[] = [];
  if (o.overall_prizes) parts.push(o.overall_prizes.replace(/\\u20b9/g, "₹"));
  parts.push(orgName);
  parts.push(o.region === "online" ? "Online" : (o.location ?? "Online"));
  return parts.join(" · ");
}

function buildDescription(o: UnstopOpportunity, orgName: string): string {
  const seoDescription = o.seo_details?.[0]?.description?.trim();
  if (seoDescription && seoDescription.length > 20) return seoDescription;
  return `${o.title}, hosted by ${orgName} via Unstop.`;
}

async function fetchUnstopPage(opportunityParam: string): Promise<UnstopOpportunity[]> {
  const res = await fetch(
    `https://unstop.com/api/public/opportunity/search?opportunity=${opportunityParam}&per_page=${PER_PAGE}`,
    { headers: { Accept: "application/json", "User-Agent": USER_AGENT }, cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Unstop API returned ${res.status} for "${opportunityParam}"`);
  const data = await res.json();
  return data?.data?.data ?? [];
}

export async function fetchUnstopCandidates(): Promise<{
  candidates: Candidate[];
  discarded: number;
}> {
  const candidates: Candidate[] = [];
  let discarded = 0;

  for (const { param, category, subtypeFilter } of OPPORTUNITY_TYPES) {
    let items: UnstopOpportunity[];
    try {
      items = await fetchUnstopPage(param);
    } catch {
      // one opportunity type failing shouldn't kill the others
      continue;
    }

    for (const o of items) {
      if (subtypeFilter && o.subtype !== subtypeFilter) {
        discarded++;
        continue;
      }

      const deadlineRaw = o.regnRequirements?.end_regn_dt ?? null;
      const deadline = deadlineRaw ? new Date(deadlineRaw) : null;
      if (deadline && deadline.getTime() <= Date.now()) {
        discarded++;
        continue;
      }
      if (!o.title || !o.public_url) {
        discarded++;
        continue;
      }

      const orgName = o.organisation?.name?.trim() || "Unstop";

      candidates.push({
        title: o.title.trim(),
        organization: orgName,
        category,
        snippet: buildSnippet(o, orgName),
        description: buildDescription(o, orgName),
        eligibility: eligibilityFor(o),
        url: `https://unstop.com/${o.public_url}`,
        deadline: deadline ? deadline.toISOString() : null,
        deadline_note:
          category === "scholarship" || category === "internship" ? "Application deadline" : null,
        region_tags: regionTagsFor(o),
        audience_tags: ["students"],
      });
    }
  }

  return { candidates, discarded };
}
