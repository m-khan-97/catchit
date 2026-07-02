import "server-only";
import type { Candidate } from "./schema";

const TOPICS = ["machine learning", "software engineering", "human computer interaction", "security"];
const MAX_DETAIL_FETCHES_PER_TOPIC = 5;
const DETAIL_FETCH_DELAY_MS = 400;
const USER_AGENT = "Mozilla/5.0 (compatible; CatchItBot/1.0)";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface RssItem {
  title: string;
  link: string;
  description: string;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const block = m[1];
    const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim();
    const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim();
    const description = block.match(/<description>([\s\S]*?)<\/description>/)?.[1]?.trim();
    if (title && link) {
      items.push({
        title: decodeEntities(title),
        link: decodeEntities(link),
        description: description ? decodeEntities(description) : "",
      });
    }
  }
  return items;
}

/**
 * WikiCFP's RSS feed gives conference *event* dates, not the paper
 * submission deadline — those are two different things and the deadline
 * only appears on the event detail page, embedded as microdata:
 * `<span property="v:summary" content="Submission Deadline">` followed by
 * a `v:startDate` span with an ISO date.
 */
function extractDeadline(html: string): Date | null {
  const match = html.match(
    /v:summary"\s+content="Submission Deadline"[\s\S]{0,300}?v:startDate"\s+content="(\d{4})-(\d{2})-(\d{2})/
  );
  if (!match) return null;
  const [, y, mo, d] = match;
  return new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), 23, 59, 59));
}

/** Prefer the conference's own site over the WikiCFP aggregator page, per our own dedup/canonical-URL rule. */
function extractOfficialLink(html: string): string | null {
  const match = html.match(/Link:\s*<a href="([^"]+)"/);
  return match ? match[1] : null;
}

function extractCfpText(html: string): string | null {
  const match = html.match(/<div class="cfp"[^>]*>([\s\S]*?)<\/div>/);
  if (!match) return null;
  const text = decodeEntities(
    match[1]
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
  ).trim();
  return text || null;
}

function extractLocation(rssDescription: string): string {
  const match = rssDescription.match(/\[([^\]]+)\]\s*\[/);
  return match ? match[1].trim() : "";
}

function regionTagsFor(location: string): string[] {
  const lower = location.toLowerCase();
  if (/\b(uk|united kingdom|england|scotland|wales|northern ireland)\b/.test(lower)) return ["UK"];
  if (lower.includes("online") || lower.includes("virtual")) return ["Remote"];
  return [];
}

async function fetchTopicFeed(topic: string): Promise<RssItem[]> {
  const res = await fetch(`http://www.wikicfp.com/cfp/rss?cat=${encodeURIComponent(topic)}`, {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`WikiCFP RSS returned ${res.status} for topic "${topic}"`);
  return parseRssItems(await res.text());
}

async function fetchEventDetail(
  url: string
): Promise<{ deadline: Date | null; officialUrl: string | null; description: string | null }> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, cache: "no-store" });
  if (!res.ok) throw new Error(`WikiCFP detail page returned ${res.status}`);
  const html = await res.text();
  return {
    deadline: extractDeadline(html),
    officialUrl: extractOfficialLink(html),
    description: extractCfpText(html),
  };
}

export async function fetchWikiCfpCandidates(): Promise<{
  candidates: Candidate[];
  discarded: number;
}> {
  const candidates: Candidate[] = [];
  let discarded = 0;

  for (const topic of TOPICS) {
    let items: RssItem[];
    try {
      items = await fetchTopicFeed(topic);
    } catch {
      // one topic feed failing shouldn't kill the others
      continue;
    }

    const seen = new Set<string>();
    let attempted = 0;

    for (const item of items) {
      if (attempted >= MAX_DETAIL_FETCHES_PER_TOPIC) break;
      if (seen.has(item.link)) continue;
      seen.add(item.link);

      // Be a polite scraper — small gap between requests to a small site.
      if (attempted > 0) await sleep(DETAIL_FETCH_DELAY_MS);
      attempted++;

      try {
        const detail = await fetchEventDetail(item.link);

        if (!detail.deadline || detail.deadline.getTime() <= Date.now()) {
          discarded++;
          continue;
        }

        // WikiCFP titles look like "SETN 2026 : 14th EETN Conference on
        // Artificial Intelligence" — no separate organizer field exists, so
        // we use the short code as a stand-in for "organization". Imperfect,
        // but admins can correct it during edit-then-approve.
        const colonIndex = item.title.indexOf(":");
        const shortName = colonIndex > -1 ? item.title.slice(0, colonIndex).trim() : item.title;
        const fullName =
          colonIndex > -1 ? item.title.slice(colonIndex + 1).trim() : item.title;

        const location = extractLocation(item.description);
        const description = detail.description
          ? detail.description.slice(0, 600)
          : item.description || item.title;

        candidates.push({
          title: fullName || item.title,
          organization: shortName,
          category: "conference",
          snippet: description.slice(0, 200),
          description,
          eligibility: [],
          url: detail.officialUrl || item.link,
          deadline: detail.deadline.toISOString(),
          deadline_note: "Paper/abstract submission deadline for this conference's call for papers",
          region_tags: regionTagsFor(location),
          audience_tags: ["researchers", "students"],
        });
      } catch {
        discarded++;
      }
    }
  }

  return { candidates, discarded };
}
