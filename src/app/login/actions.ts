"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";

const emailSchema = z.string().trim().toLowerCase().email().max(254);

export interface MagicLinkState {
  status: "idle" | "code_sent" | "error";
  message?: string;
  email?: string;
  next?: string;
}

export async function requestMagicLink(
  _prev: MagicLinkState,
  formData: FormData
): Promise<MagicLinkState> {
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown";
  if (isRateLimited(`login:${ip}`)) {
    return { status: "error", message: "Too many attempts — try again in a bit." };
  }

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { status: "error", message: "Enter a valid email address." };
  }

  const next = String(formData.get("next") ?? "/account");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await createClient();

  // Sends one email containing both a clickable link (handled by
  // /auth/callback) and a 6-digit code (handled by verifyLoginCode below).
  // The code exists specifically because corporate/university mail
  // scanners (Outlook "Safe Links" and similar) pre-fetch every link in an
  // incoming email to check it's safe — which consumes a single-use magic
  // link before the person ever clicks it, so the link alone isn't
  // reliable for exactly the .ac.uk audience this product targets.
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    console.error(`signInWithOtp failed for ${parsed.data}: ${error.message}`);
    return { status: "error", message: "Something went wrong — please try again." };
  }

  return { status: "code_sent", email: parsed.data, next };
}

export interface VerifyCodeState {
  status: "idle" | "error";
  message?: string;
}

export async function verifyLoginCode(
  _prev: VerifyCodeState,
  formData: FormData
): Promise<VerifyCodeState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const code = String(formData.get("code") ?? "").trim();
  const next = String(formData.get("next") ?? "/account");

  if (!email || !code) {
    return { status: "error", message: "Enter the 6-digit code from your email." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });

  if (error) {
    console.error(`verifyOtp failed for ${email}: ${error.message}`);
    return { status: "error", message: "That code didn't work — check it and try again." };
  }

  redirect(next);
}
