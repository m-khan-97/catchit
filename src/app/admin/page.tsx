import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ReviewQueue } from "./review-queue";
import { BrokenLinks } from "./broken-links";
import { StoryQueue } from "./story-queue";
import { signOut } from "./actions";
import { findNearDuplicates } from "@/lib/discovery/near-duplicates";
import { CATEGORIES, CATEGORY_LABELS, type OpportunityCategory } from "@/lib/supabase/types";
import { CATEGORY_STYLES } from "@/lib/opportunities/styles";
import { FilterChips, type ChipOption } from "@/components/filter-chips";

export const metadata: Metadata = { title: "Review queue" };

type SearchParams = { [key: string]: string | string[] | undefined };

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function isCategory(value: string): value is OpportunityCategory {
  return (CATEGORIES as readonly string[]).includes(value);
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const rawCategory = first(sp.category);
  // Ignore an unknown ?category= rather than showing an empty queue that
  // looks like "nothing to review".
  const category: OpportunityCategory | "all" = isCategory(rawCategory) ? rawCategory : "all";

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

  // Category counts come from every pending row (one column, so cheap) so
  // the chips still show the full picture while a filter is applied.
  const { data: pendingCategories, error: countsError } = await supabase
    .from("opportunities")
    .select("category")
    .eq("status", "pending");
  if (countsError) throw countsError;

  const countByCategory = new Map<string, number>();
  for (const row of pendingCategories ?? []) {
    countByCategory.set(row.category, (countByCategory.get(row.category) ?? 0) + 1);
  }
  const totalPending = pendingCategories?.length ?? 0;

  let queueQuery = supabase
    .from("opportunities")
    .select("*")
    .eq("status", "pending")
    .order("discovered_at", { ascending: false });
  if (category !== "all") queueQuery = queueQuery.eq("category", category);

  const { data: queue, error } = await queueQuery;

  if (error) throw error;

  const { data: brokenLinks, error: brokenLinksError } = await supabase
    .from("opportunities")
    .select("*")
    .eq("status", "approved")
    .eq("link_status", "broken")
    .order("last_checked_at", { ascending: false });

  if (brokenLinksError) throw brokenLinksError;

  const { data: pendingStories, error: pendingStoriesError } = await supabase
    .from("stories")
    .select("*")
    .eq("status", "pending")
    .order("submitted_at", { ascending: false });

  if (pendingStoriesError) throw pendingStoriesError;

  // Scan across pending + approved for "close but not auto-blocked" title
  // matches — see near-duplicates.ts for the exact band. Approved-only
  // titles aren't in `queue`, so fetch them separately. Matching is
  // within-category, so a filtered view only needs that category's titles —
  // which is what keeps this affordable once the queue grows: the scan is
  // quadratic in the number of titles it's given.
  let approvedQuery = supabase
    .from("opportunities")
    .select("id,title,category,status")
    .eq("status", "approved");
  if (category !== "all") approvedQuery = approvedQuery.eq("category", category);

  const { data: approvedTitles, error: approvedTitlesError } = await approvedQuery;
  if (approvedTitlesError) throw approvedTitlesError;

  const nearDuplicates = findNearDuplicates([
    ...(queue ?? []).map((o) => ({ id: o.id, title: o.title, category: o.category, status: o.status })),
    ...(approvedTitles ?? []),
  ]);

  const pendingCount = queue?.length ?? 0;

  const currentParams = new URLSearchParams();
  if (category !== "all") currentParams.set("category", category);

  // Only offer categories that actually have something waiting — chips for
  // empty categories are noise on a queue this size.
  const categoryOptions: ChipOption[] = [
    { value: "all", label: `All (${totalPending})` },
    ...CATEGORIES.filter((c) => (countByCategory.get(c) ?? 0) > 0).map((c) => ({
      value: c,
      label: `${CATEGORY_LABELS[c]} (${countByCategory.get(c)})`,
      dotClass: CATEGORY_STYLES[c].dot,
    })),
  ];

  return (
    <section>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink">Review queue</h1>
          <p className="mt-1 text-[14.5px] text-ink-3">
            {category === "all" ? (
              <>
                {pendingCount} item{pendingCount === 1 ? "" : "s"} waiting on you
              </>
            ) : (
              <>
                {pendingCount} of {totalPending} · {CATEGORY_LABELS[category]}
              </>
            )}{" "}
            · students never see this page
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
      {categoryOptions.length > 1 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <FilterChips
            paramKey="category"
            options={categoryOptions}
            active={category}
            currentParams={currentParams}
            basePath="/admin"
          />
        </div>
      )}
      <ReviewQueue queue={queue ?? []} nearDuplicates={Object.fromEntries(nearDuplicates)} />
      <BrokenLinks items={brokenLinks ?? []} />
      <StoryQueue stories={pendingStories ?? []} />
    </section>
  );
}
