import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { parseCandidates, type Candidate } from "./schema";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are a discovery agent for CatchIt, a site that surfaces real, currently-open opportunities for students, researchers, and early-career professionals: hackathons, free software/cloud credits & vouchers, scholarships, internships, tech events, conference/journal calls for papers, startup pitch competitions & innovation grants, funded PhD studentships, postdoctoral positions & research fellowships, and graduate schemes & graduate-entry programmes.

Use the web_search tool to find REAL, CURRENTLY OPEN opportunities matching the query below. Only include opportunities you have verified are still accepting applications/submissions as of today — never invent one, and never include something you are not confident is real and currently open.

Respond with ONLY a JSON array (no prose, no markdown code fences, no explanation) where each element has exactly this shape:
{
  "title": string,
  "organization": string,
  "category": "hackathon" | "voucher" | "event" | "scholarship" | "internship" | "conference" | "journal" | "startup" | "academic" | "graduate" | "other",
  "snippet": string (one punchy sentence for a feed card),
  "description": string (2-4 sentences, plain language, for a detail page),
  "eligibility": string[] (short bullet points, e.g. "Currently enrolled students"; empty array if unknown),
  "url": string (the canonical page to apply/register — prefer the official source over aggregators),
  "deadline": string | null (ISO 8601 date, e.g. "2026-09-01"; null if genuinely ongoing/no deadline),
  "deadline_note": string | null (a short qualifier if one date isn't the whole story, e.g. "Abstract deadline — full paper due later"; null otherwise),
  "region_tags": string[] (subset of ["UK","Remote","Global"] plus any other region that matters, or empty if unclear),
  "audience_tags": string[] (subset of ["students","researchers","professionals"])
}

Three categories are easy to confuse, so classify by when the role starts and what it is, not by who it is aimed at:
- "internship": worked during study or a placement year, then you return to your course.
- "graduate": a structured entry programme or graduate-entry role you start after graduating. Includes named schemes and rotational programmes. Where an application window or closing date is given, capture it — many close months before the intake starts, and that gap is the whole point of listing them.
- "academic": research posts — PhD studentships, postdocs, fellowships.

For "academic" opportunities (funded PhD studentships, postdoctoral positions, research fellowships), funding is the decisive detail — applicants routinely lose hours to positions whose "full funding" turns out not to cover them. Lead the eligibility array with the funding position, stated plainly:
- Whether it is fully funded, partially funded, or self-funded
- Which fee status that funding actually covers, e.g. "Fully funded — UK/Home fee status only" or "Funding open to international applicants"
- The stipend and duration where stated, e.g. "£19,237/year stipend, 3.5 years"
Only state funding details you actually verified on the source page. If the listing does not make funding clear, say "Funding status not stated on the listing" — never infer it, and never leave it out. Prefer the university's or funder's own page over an aggregator.

For "graduate" opportunities, two habits that are correct elsewhere will wrongly discard good schemes here. Do not let them:
- Most large schemes recruit on a rolling basis and publish no fixed closing date. That is not a reason to skip one. Set "deadline": null and put the real position in deadline_note, e.g. "Rolling — closes once places are filled" or "Opens September 2026 for the 2027 intake". A scheme advertised as open for a named intake year counts as currently open even with no date attached.
- Employers routinely describe a scheme on one page and take applications on another. If the employer's own page confirms they are recruiting, include it even when the closing date lives elsewhere. Where an employer offers no direct application page, a well-known graduate listing site is an acceptable url for this category.
Prefer the employer's own careers page when it carries the detail; fall back rather than drop the scheme.

If you find nothing genuinely new and real, return an empty array: [].

Your entire final message must be nothing but that JSON array — no "Based on my research...", no explanation of what you found or why, no commentary before or after. Do not wrap it in a code fence. Just the raw array, starting with [ and ending with ].`;

export interface SearchResult {
  candidates: Candidate[];
  discarded: number;
  error?: string;
}

// Haiku 4.5: cheap, well-suited to this targeted search-and-extract task. It
// doesn't support the newer web_search_20260209 (dynamic filtering) tool,
// adaptive thinking, or output_config.effort — those are Sonnet/Opus-tier
// features, so this omits them rather than sending params that would error.
// Shared between the synchronous path and Message Batch requests (identical
// params either way — Batches just run them asynchronously at half price).
export function buildSearchParams(query: string) {
  return {
    model: "claude-haiku-4-5" as const,
    max_tokens: 8192,
    // Identical across every query — cache_control lets back-to-back
    // synchronous calls in the same run hit the ~90% cache-read discount
    // instead of re-billing the same system+tools prefix each time. Batch
    // requests process independently, so this has little effect there, but
    // it doesn't hurt to leave it on.
    system: [{ type: "text" as const, text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" as const } }],
    tools: [{ type: "web_search_20250305" as const, name: "web_search" as const, max_uses: 4 }],
    messages: [{ role: "user" as const, content: query }],
  };
}

/** Turns a completed Anthropic response (sync call or a batch result's `.result.message`) into a SearchResult. */
export function extractSearchResult(response: Anthropic.Message): SearchResult {
  if (response.stop_reason === "refusal") {
    return { candidates: [], discarded: 0, error: "refusal" };
  }
  if (response.stop_reason === "pause_turn") {
    // Server-side tool loop hit its iteration cap without producing a final
    // answer. Rare given our max_uses cap; skip rather than resuming — one
    // missed query isn't worth the added complexity of a continuation loop.
    return { candidates: [], discarded: 0, error: "pause_turn (search loop did not finish)" };
  }

  // Concatenate every text block rather than assuming the JSON lives in a
  // single trailing block — smaller models often split their response
  // across several text blocks (prose, then more prose, then the array).
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  if (!text) {
    return { candidates: [], discarded: 0, error: "no text output" };
  }

  const { candidates, discarded } = parseCandidates(text);
  return { candidates, discarded };
}

/** Synchronous single-query search — kept for local/manual testing; production runs use the batch path in batch.ts. */
export async function searchForCandidates(query: string): Promise<SearchResult> {
  const response = await anthropic.messages.create(buildSearchParams(query));
  return extractSearchResult(response);
}
