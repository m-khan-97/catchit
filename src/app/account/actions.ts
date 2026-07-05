"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, AUDIENCE_TAGS, APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/supabase/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return { supabase, user };
}

export async function saveOpportunity(opportunityId: string) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("saved_opportunities")
    .insert({ user_id: user.id, opportunity_id: opportunityId });
  // 23505 = unique_violation — already saved, not an error worth surfacing.
  if (error && error.code !== "23505") throw new Error(error.message);

  revalidatePath("/opportunity/[id]", "page");
  revalidatePath("/account");
}

export async function unsaveOpportunity(opportunityId: string) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("saved_opportunities")
    .delete()
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunityId);
  if (error) throw new Error(error.message);

  revalidatePath("/opportunity/[id]", "page");
  revalidatePath("/account");
}

export async function setApplicationStatus(opportunityId: string, status: string) {
  const { supabase, user } = await requireUser();

  if (!(APPLICATION_STATUSES as readonly string[]).includes(status)) {
    throw new Error("Invalid status");
  }

  const { error } = await supabase
    .from("saved_opportunities")
    .update({ status: status as ApplicationStatus, status_updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunityId);
  if (error) throw new Error(error.message);

  revalidatePath("/account");
  revalidatePath("/stats");
}

export async function followFilter(formData: FormData) {
  const { supabase, user } = await requireUser();

  const category = String(formData.get("category") ?? "all");
  const region = String(formData.get("region") ?? "all");
  const audience = String(formData.get("audience") ?? "all");

  const categories =
    category !== "all" && (CATEGORIES as readonly string[]).includes(category) ? [category] : [];
  const regions = region !== "all" ? [region] : [];
  const audiences =
    audience !== "all" && (AUDIENCE_TAGS as readonly string[]).includes(audience)
      ? [audience]
      : [];

  const { error } = await supabase
    .from("followed_filters")
    .insert({ user_id: user.id, categories, regions, audiences });
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/account");
}

export async function unfollowFilter(filterId: string) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("followed_filters")
    .delete()
    .eq("id", filterId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/account");
}

export async function signOutAccount() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function savePushSubscription(subscription: PushSubscriptionInput) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("push_subscriptions").insert({
    user_id: user.id,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
  });
  // 23505 = unique_violation — this browser is already subscribed.
  if (error && error.code !== "23505") throw new Error(error.message);
}

export async function removePushSubscription(endpoint: string) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);
  if (error) throw new Error(error.message);
}
