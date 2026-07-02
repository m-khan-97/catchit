import "server-only";
import type { Candidate } from "./schema";

interface DevpostHackathon {
  title: string;
  organization_name: string;
  url: string;
  displayed_location: { location: string };
  submission_period_dates: string;
  themes: { id: number; name: string }[];
  prize_amount: string;
  invite_only: boolean;
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").trim();
}

/**
 * Devpost's `submission_period_dates` is a human string, not a clean date:
 * "Jul 19, 2026" (single day), "Jul 01 - 31, 2026" (same month), or
 * "Jun 30 - Aug 18, 2026" (cross-month). We only care about the end date —
 * that's the actionable submission deadline.
 */
export function parseDevpostDeadline(raw: string): Date | null {
  let m = raw.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/);
  if (m) {
    const month = MONTHS[m[1].toLowerCase()];
    if (month === undefined) return null;
    return new Date(Date.UTC(Number(m[3]), month, Number(m[2]), 23, 59, 59));
  }

  m = raw.match(/^([A-Za-z]{3})\s+(\d{1,2})\s*-\s*(?:([A-Za-z]{3})\s+)?(\d{1,2}),\s*(\d{4})$/);
  if (m) {
    const startMonth = MONTHS[m[1].toLowerCase()];
    const endMonth = m[3] ? MONTHS[m[3].toLowerCase()] : startMonth;
    if (startMonth === undefined || endMonth === undefined) return null;
    let year = Number(m[5]);
    if (endMonth < startMonth) year += 1; // wraps into next year (e.g. Dec -> Jan)
    return new Date(Date.UTC(year, endMonth, Number(m[4]), 23, 59, 59));
  }

  return null;
}

function regionTagsFor(location: string): string[] {
  const lower = location.toLowerCase();
  if (lower.includes("online")) return ["Remote"];
  if (/\b(uk|united kingdom|england|scotland|wales|northern ireland)\b/.test(lower)) return ["UK"];
  return [];
}

function buildSnippet(h: DevpostHackathon): string {
  const prize = stripHtml(h.prize_amount);
  const themes = h.themes.slice(0, 3).map((t) => t.name).join(", ");
  const parts: string[] = [];
  if (prize && prize !== "$0") parts.push(`${prize} in prizes`);
  if (themes) parts.push(themes);
  parts.push(h.displayed_location.location.trim() || "Online");
  return parts.join(" · ");
}

function buildDescription(h: DevpostHackathon): string {
  const themes = h.themes.map((t) => t.name).join(", ");
  return `${h.title} is a hackathon hosted by ${h.organization_name}${
    themes ? `, focused on ${themes}` : ""
  }. Submissions run ${h.submission_period_dates}, hosted ${
    h.displayed_location.location.trim() || "online"
  }.`;
}

async function fetchDevpostPage(status: "open" | "upcoming"): Promise<DevpostHackathon[]> {
  const res = await fetch(
    `https://devpost.com/api/hackathons?status[]=${status}&order_by=recently-added`,
    { headers: { Accept: "application/json" }, cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Devpost API returned ${res.status}`);
  const data = await res.json();
  return data.hackathons ?? [];
}

export async function fetchDevpostCandidates(): Promise<{
  candidates: Candidate[];
  discarded: number;
}> {
  const [open, upcoming] = await Promise.all([
    fetchDevpostPage("open"),
    fetchDevpostPage("upcoming"),
  ]);

  const all = [...open, ...upcoming];
  const candidates: Candidate[] = [];
  let discarded = 0;

  for (const h of all) {
    const deadline = parseDevpostDeadline(h.submission_period_dates);
    if (deadline && deadline.getTime() <= Date.now()) {
      discarded++;
      continue;
    }
    if (!h.url || !h.title || !h.organization_name) {
      discarded++;
      continue;
    }
    candidates.push({
      title: h.title.trim(),
      organization: h.organization_name.trim(),
      category: "hackathon",
      snippet: buildSnippet(h),
      description: buildDescription(h),
      eligibility: h.invite_only
        ? ["Invite-only — check the hackathon page for how to get an invite"]
        : [],
      url: h.url,
      deadline: deadline ? deadline.toISOString() : null,
      deadline_note: null,
      region_tags: regionTagsFor(h.displayed_location.location),
      audience_tags: ["students", "professionals"],
    });
  }

  return { candidates, discarded };
}
