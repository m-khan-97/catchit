"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";
import { CATEGORIES, AUDIENCE_TAGS } from "@/lib/supabase/types";

const submitSchema = z.object({
  title: z.string().trim().min(1, "Tell us what it is.").max(200),
  organization: z.string().trim().min(1, "Tell us who's running it.").max(200),
  category: z.enum(CATEGORIES),
  url: z
    .string()
    .trim()
    .min(1, "A source link is required.")
    .refine((v) => {
      try {
        const u = new URL(v);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    }, "Enter a valid link, including https://"),
  description: z.string().trim().min(1, "A one-line description is required.").max(500),
  deadline: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Enter a valid date"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email, or leave it blank.")
    .optional()
    .or(z.literal("")),
});

export interface SubmitState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
}

export async function submitOpportunity(
  _prev: SubmitState,
  formData: FormData
): Promise<SubmitState> {
  // Honeypot: real visitors never see or fill this field (see submit-form.tsx).
  // Bots that fill every input trip it — pretend success so they don't adapt.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { status: "success" };
  }

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown";
  if (isRateLimited(ip)) {
    return {
      status: "error",
      message: "Too many submissions from this connection — try again in a bit.",
    };
  }

  const audience = formData
    .getAll("audience")
    .map(String)
    .filter((a): a is (typeof AUDIENCE_TAGS)[number] => (AUDIENCE_TAGS as readonly string[]).includes(a));

  const parsed = submitSchema.safeParse({
    title: formData.get("title"),
    organization: formData.get("organization"),
    category: formData.get("category"),
    url: formData.get("url"),
    description: formData.get("description"),
    deadline: formData.get("deadline"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: "error", message: "Check the highlighted fields.", fieldErrors };
  }

  const { title, organization, category, url, description, deadline, email } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("opportunities").insert({
    title,
    organization,
    category,
    snippet: description,
    description,
    url,
    deadline: deadline ? new Date(deadline).toISOString() : null,
    audience_tags: audience.length > 0 ? audience : ["students"],
    source: "user-submitted",
    submitter_email: email || null,
  });

  if (error) {
    return { status: "error", message: "Something went wrong on our end — please try again." };
  }

  return { status: "success" };
}
