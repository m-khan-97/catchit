"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";

const storySchema = z.object({
  name: z.string().trim().min(2, "Tell us your name.").max(80),
  role_line: z.string().trim().max(80).optional(),
  story: z
    .string()
    .trim()
    .min(30, "A few more words would help — what did CatchIt help you catch?")
    .max(1000),
  opportunity_url: z
    .string()
    .trim()
    .optional()
    .refine((v) => {
      if (!v) return true;
      try {
        const u = new URL(v);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    }, "Enter a valid link, including https://, or leave it blank."),
});

export interface SubmitStoryState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
}

export async function submitStory(
  _prev: SubmitStoryState,
  formData: FormData
): Promise<SubmitStoryState> {
  // Honeypot: real visitors never see or fill this field (see story-form.tsx).
  // Bots that fill every input trip it — pretend success so they don't adapt.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { status: "success" };
  }

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown";
  if (isRateLimited(`story:${ip}`)) {
    return {
      status: "error",
      message: "Too many submissions from this connection — try again in a bit.",
    };
  }

  const parsed = storySchema.safeParse({
    name: formData.get("name"),
    role_line: formData.get("role_line"),
    story: formData.get("story"),
    opportunity_url: formData.get("opportunity_url"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: "error", message: "Check the highlighted fields.", fieldErrors };
  }

  const { name, role_line, story, opportunity_url } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("stories").insert({
    name,
    role_line: role_line || "",
    story,
    opportunity_url: opportunity_url || null,
  });

  if (error) {
    return { status: "error", message: "Something went wrong on our end — please try again." };
  }

  return { status: "success" };
}
