import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ReviewQueue } from "./review-queue";
import { BrokenLinks } from "./broken-links";
import { signOut } from "./actions";
import { findNearDuplicates } from "@/lib/discovery/near-duplicates";

export const metadata: Metadata = { title: "Review queue" };

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: isAdminData } = await supabase.rpc("is_admin");
  const isAdmin = Boolean(isAdminData);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdmin) {
    return (
      <section className="mx-auto max-w-[440px] pt-10 text-center">
        <h1 className="mb-2 font-display text-xl font-bold text-ink">Not on the admin team</h1>
        <p className="mb-6 text-[15px] text-ink-3">
          You&apos;re signed in as {user?.email}, but this account isn&apos;t on the CatchIt review
          team yet. Ask an existing admin to add you.
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-ink"
          >
            Sign out
          </button>
        </form>
      </section>
    );
  }

  const { data: queue, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("status", "pending")
    .order("discovered_at", { ascending: false });

  if (error) throw error;

  const { data: brokenLinks, error: brokenLinksError } = await supabase
    .from("opportunities")
    .select("*")
    .eq("status", "approved")
    .eq("link_status", "broken")
    .order("last_checked_at", { ascending: false });

  if (brokenLinksError) throw brokenLinksError;

  // Lightweight scan across pending + approved for "close but not
  // auto-blocked" title matches — see near-duplicates.ts for the exact
  // band. Approved-only titles aren't in `queue`, so fetch them separately.
  const { data: approvedTitles, error: approvedTitlesError } = await supabase
    .from("opportunities")
    .select("id,title,category,status")
    .eq("status", "approved");
  if (approvedTitlesError) throw approvedTitlesError;

  const nearDuplicates = findNearDuplicates([
    ...(queue ?? []).map((o) => ({ id: o.id, title: o.title, category: o.category, status: o.status })),
    ...(approvedTitles ?? []),
  ]);

  const pendingCount = queue?.length ?? 0;

  return (
    <section>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink">Review queue</h1>
          <p className="mt-1 text-[14.5px] text-ink-3">
            {pendingCount} item{pendingCount === 1 ? "" : "s"} waiting on you · students never see
            this page
          </p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-ink-3"
          >
            Sign out
          </button>
        </form>
      </div>
      <ReviewQueue queue={queue ?? []} nearDuplicates={Object.fromEntries(nearDuplicates)} />
      <BrokenLinks items={brokenLinks ?? []} />
    </section>
  );
}
