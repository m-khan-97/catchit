import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { parseCandidates, type Candidate } from "./schema";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are a discovery agent for CatchIt, a site that surfaces real, currently-open opportunities for students, researchers, and early-career professionals: hackathons, free software/cloud credits & vouchers, scholarships, internships, tech events, and conference/journal calls for papers.

Use the web_search tool to find REAL, CURRENTLY OPEN opportunities matching the query below. Only include opportunities you have verified are still accepting applications/submissions as of today — never invent one, and never include something you are not confident is real and currently open.

Respond with ONLY a JSON array (no prose, no markdown code fences, no explanation) where each element has exactly this shape:
{
  "title": string,
  "organization": string,
  "category": "hackathon" | "voucher" | "event" | "scholarship" | "internship" | "conference" | "journal" | "other",
  "snippet": string (one punchy sentence for a feed card),
  "description": string (2-4 sentences, plain language, for a detail page),
  "eligibility": string[] (short bullet points, e.g. "Currently enrolled students"; empty array if unknown),
  "url": string (the canonical page to apply/register — prefer the official source over aggregators),
  "deadline": string | null (ISO 8601 date, e.g. "2026-09-01"; null if genuinely ongoing/no deadline),
  "deadline_note": string | null (a short qualifier if one date isn't the whole story, e.g. "Abstract deadline — full paper due later"; null otherwise),
  "region_tags": string[] (subset of ["UK","Remote","Global"] plus any other region that matters, or empty if unclear),
  "audience_tags": string[] (subset of ["students","researchers","professionals"])
}

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
