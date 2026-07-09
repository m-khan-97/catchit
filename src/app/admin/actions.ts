"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, AUDIENCE_TAGS } from "@/lib/supabase/types";
import { sendApprovalNotification, sendBulkApprovalNotifications } from "@/lib/discord";

function parseOpportunityForm(formData: FormData) {
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

  return {
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
  };
}

export async function approveOpportunity(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await sendApprovalNotification(data);

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

export async function bulkApprove(ids: string[]) {
  if (ids.length === 0) return;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .in("id", ids)
    .select();

  if (error) throw new Error(error.message);

  await sendBulkApprovalNotifications(data ?? []);

  revalidatePath("/admin");
}

export async function bulkReject(ids: string[]) {
  if (ids.length === 0) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("opportunities")
    .update({ status: "rejected", reviewed_at: new Date().toISOString() })
    .in("id", ids);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function saveAndApprove(id: string, formData: FormData) {
  const fields = parseOpportunityForm(formData);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .update({ ...fields, status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await sendApprovalNotification(data);

  revalidatePath("/admin");
}

/** Fixes a live (approved) opportunity — e.g. correcting a broken link — and
 * marks it for re-verification on the next dead-link-check run. */
export async function updateApprovedOpportunity(id: string, formData: FormData) {
  const fields = parseOpportunityForm(formData);

  const supabase = await createClient();
  const { error } = await supabase
    .from("opportunities")
    .update({ ...fields, link_status: "unchecked" })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

/** Pulls a live opportunity off the public feed (e.g. an unfixable dead link). */
export async function unpublishOpportunity(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("opportunities")
    .update({ status: "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function approveStory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("stories")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/stories");
}

export async function rejectStory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("stories")
    .update({ status: "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
