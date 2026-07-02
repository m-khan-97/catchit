"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, AUDIENCE_TAGS } from "@/lib/supabase/types";

export async function approveOpportunity(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("opportunities")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  // TODO(Milestone 5): fire the Discord webhook here once it's built.

  revalidatePath("/admin");
}

export async function rejectOpportunity(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("opportunities")
    .update({ status: "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function saveAndApprove(id: string, formData: FormData) {
  const category = String(formData.get("category"));
  if (!(CATEGORIES as readonly string[]).includes(category)) {
    throw new Error("Invalid category");
  }

  const regionTags = String(formData.get("region_tags") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const audienceTags = formData
    .getAll("audience_tags")
    .map(String)
    .filter((a): a is (typeof AUDIENCE_TAGS)[number] => (AUDIENCE_TAGS as readonly string[]).includes(a));

  const eligibility = String(formData.get("eligibility") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const deadlineRaw = String(formData.get("deadline") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("opportunities")
    .update({
      title: String(formData.get("title") ?? "").trim(),
      organization: String(formData.get("organization") ?? "").trim(),
      category: category as (typeof CATEGORIES)[number],
      snippet: String(formData.get("snippet") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      url: String(formData.get("url") ?? "").trim(),
      deadline: deadlineRaw ? new Date(deadlineRaw).toISOString() : null,
      deadline_note: String(formData.get("deadline_note") ?? "").trim() || null,
      region_tags: regionTags,
      audience_tags: audienceTags.length > 0 ? audienceTags : ["students"],
      eligibility,
      status: "approved",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  // TODO(Milestone 5): fire the Discord webhook here once it's built.

  revalidatePath("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
