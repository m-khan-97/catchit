"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRateLimited } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email/resend";
import { confirmationEmail } from "@/lib/email/templates";
import { CATEGORIES, AUDIENCE_TAGS } from "@/lib/supabase/types";

const emailSchema = z.string().trim().toLowerCase().email().max(254);

export interface DigestSignupState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function subscribeToDigest(
  _prev: DigestSignupState,
  formData: FormData
): Promise<DigestSignupState> {
  // Honeypot — same pattern as the submit form; bots that fill every
  // field get a fake success so they don't adapt.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { status: "success" };
  }

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown";
  if (isRateLimited(`digest:${ip}`)) {
    return { status: "error", message: "Too many attempts — try again in a bit." };
  }

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { status: "error", message: "Enter a valid email address." };
  }
  const email = parsed.data;

  const categories = formData
    .getAll("categories")
    .map(String)
    .filter((c) => (CATEGORIES as readonly string[]).includes(c));
  const audiences = formData
    .getAll("audiences")
    .map(String)
    .filter((a) => (AUDIENCE_TAGS as readonly string[]).includes(a));

  // Subscribers table is RLS deny-all for anon by design; all access is
  // through this server action with the service role.
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("subscribers")
    .select("id, confirm_token, confirmed_at")
    .eq("email", email)
    .maybeSingle();

  let confirmToken: string;

  if (existing?.confirmed_at) {
    // Already confirmed — update prefs, don't reveal that they were
    // already subscribed (the success message reads the same either way).
    await supabase
      .from("subscribers")
      .update({ categories, audiences })
      .eq("id", existing.id);
    return { status: "success" };
  } else if (existing) {
    // Signed up before but never confirmed — refresh prefs, resend link.
    await supabase.from("subscribers").update({ categories, audiences }).eq("id", existing.id);
    confirmToken = existing.confirm_token;
  } else {
    const { data: inserted, error } = await supabase
      .from("subscribers")
      .insert({ email, categories, audiences })
      .select("confirm_token")
      .single();
    if (error) {
      return { status: "error", message: "Something went wrong — please try again." };
    }
    confirmToken = inserted.confirm_token;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const confirmUrl = `${siteUrl}/digest/confirm?token=${confirmToken}`;
  const { subject, html } = confirmationEmail(confirmUrl);
  const result = await sendEmail({ to: email, subject, html });

  if (!result.ok) {
    console.error(`Digest confirmation email failed for ${email}: ${result.error}`);
    return {
      status: "error",
      message: "We couldn't send the confirmation email — please try again later.",
    };
  }

  return { status: "success" };
}
