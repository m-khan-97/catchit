import "server-only";
import { z } from "zod";
import { CATEGORIES, AUDIENCE_TAGS } from "@/lib/supabase/types";

export const candidateSchema = z.object({
  title: z.string().trim().min(1).max(300),
  organization: z.string().trim().min(1).max(300),
  category: z.enum(CATEGORIES),
  snippet: z.string().trim().min(1).max(400),
  description: z.string().trim().min(1).max(2000),
  eligibility: z.array(z.string().trim().min(1)).max(10).optional().default([]),
  url: z
    .string()
    .trim()
    .refine((v) => {
      try {
        const u = new URL(v);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    }, "must be a valid http(s) URL"),
  deadline: z
    .string()
    .trim()
    .nullable()
    .optional()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), "deadline must be a valid date string")
    .refine((v) => !v || new Date(v).getTime() > Date.now(), "deadline is already in the past")
    // Normalize whatever date format the source produced to a clean ISO
    // string, so every row in the DB has an unambiguous UTC timestamp.
    .transform((v) => (v ? new Date(v).toISOString() : v)),
  deadline_note: z.string().trim().nullable().optional(),
  region_tags: z.array(z.string().trim().min(1)).max(5).optional().default([]),
  audience_tags: z.array(z.enum(AUDIENCE_TAGS)).max(3).optional().default([]),
});

export type Candidate = z.infer<typeof candidateSchema>;

/**
 * Extracts the JSON array text from a model response, even when the model
 * ignores the "JSON only, no prose" instruction — smaller models routinely
 * do, wrapping the array in explanatory paragraphs with a fenced code
 * block somewhere in the middle rather than at the start of the response.
 */
function extractJsonArrayText(raw: string): string | null {
  const trimmed = raw.trim();

  // Fast path: the whole response is already a clean JSON array.
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) return trimmed;

  // A ```json ... ``` fenced block anywhere in the text, not just at the edges.
  const fenceMatch = trimmed.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
  if (fenceMatch) return fenceMatch[1];

  // Last resort: the first '[' to the matching last ']' in the whole text.
  const firstBracket = trimmed.indexOf("[");
  const lastBracket = trimmed.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    return trimmed.slice(firstBracket, lastBracket + 1);
  }

  return null;
}

/**
 * Parses a discovery-source's raw response text into validated candidates.
 * Invalid items are discarded individually rather than failing the whole
 * batch — one malformed entry from an AI-search response shouldn't drop
 * everything else it found.
 */
export function parseCandidates(raw: string): { candidates: Candidate[]; discarded: number } {
  const jsonText = extractJsonArrayText(raw);
  if (!jsonText) return { candidates: [], discarded: 0 };

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(jsonText);
  } catch {
    return { candidates: [], discarded: 0 };
  }

  if (!Array.isArray(parsedJson)) return { candidates: [], discarded: 0 };

  const candidates: Candidate[] = [];
  let discarded = 0;
  for (const item of parsedJson) {
    const result = candidateSchema.safeParse(item);
    if (result.success) candidates.push(result.data);
    else discarded++;
  }
  return { candidates, discarded };
}
