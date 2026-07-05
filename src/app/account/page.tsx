import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LABELS, AUDIENCE_LABELS, type FollowedFilter } from "@/lib/supabase/types";
import { CategoryBadge } from "@/components/category-badge";
import { formatDeadlineFull } from "@/lib/opportunities/format";
import { unsaveOpportunity, unfollowFilter, signOutAccount } from "./actions";
import { PushToggle } from "./push-toggle";
import { StatusSelect } from "./status-select";

export const metadata: Metadata = { title: "My account" };

function filterLabel(f: Pick<FollowedFilter, "categories" | "regions" | "audiences">): string {
  const categoryPart = f.categories.length
    ? f.categories.map((c) => CATEGORY_LABELS[c as keyof typeof CATEGORY_LABELS] ?? c).join(", ")
    : "All categories";
  const regionPart = f.regions.length ? f.regions.join(", ") : "All regions";
  const audiencePart = f.audiences.length
    ? f.audiences.map((a) => AUDIENCE_LABELS[a as keyof typeof AUDIENCE_LABELS] ?? a).join(", ")
    : "All audiences";
  return `${categoryPart} · ${regionPart} · ${audiencePart}`;
}

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const [{ data: profile }, { data: savedRows }, { data: filters }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("saved_opportunities")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("followed_filters")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  // saved_opportunities.opportunity_id references the base `opportunities`
  // table, which regular users can't SELECT directly (admin-only RLS) — so
  // a second query against the public view instead of a foreign-key embed.
  const savedIds = (savedRows ?? []).map((r) => r.opportunity_id);
  const { data: savedOpportunities } =
    savedIds.length > 0
      ? await supabase.from("opportunities_public").select("*").in("id", savedIds)
      : { data: [] };

  const statusByOpportunityId = new Map((savedRows ?? []).map((r) => [r.opportunity_id, r.status]));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const calendarUrl = profile ? `${siteUrl}/calendar.ics?token=${profile.calendar_token}` : null;

  return (
    <section>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink">
            My account
          </h1>
          <p className="mt-1 text-[14.5px] text-ink-3">{user.email}</p>
        </div>
        <form action={signOutAccount}>
          <button
            type="submit"
            className="rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-ink-3"
          >
            Sign out
          </button>
        </form>
      </div>

      {calendarUrl && (
        <div className="mb-7 rounded-2xl border border-border bg-surface px-5 py-4">
          <div className="mb-1 font-display text-[15px] font-semibold text-ink">
            Your personal calendar feed
          </div>
          <p className="mb-2.5 text-[13.5px] text-ink-3">
            Deadlines from your saved items and followed filters — subscribe in any calendar app.
          </p>
          <code className="block truncate rounded-lg bg-bg px-3 py-2 text-[12.5px] text-ink-3">
            {calendarUrl}
          </code>
        </div>
      )}

      <PushToggle />

      <h2 className="mb-3 font-display text-lg font-bold text-ink">Followed filters</h2>
      {(filters ?? []).length === 0 ? (
        <p className="mb-7 text-sm text-ink-4">
          None yet — use &quot;Follow this filter&quot; on the feed.
        </p>
      ) : (
        <div className="mb-7 flex flex-col gap-2">
          {filters!.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3"
            >
              <span className="text-[13.5px] text-ink-2">{filterLabel(f)}</span>
              <form action={unfollowFilter.bind(null, f.id)}>
                <button
                  type="submit"
                  className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-ink-4 hover:text-danger-ink"
                >
                  Remove
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-3 font-display text-lg font-bold text-ink">Saved opportunities</h2>
      {(savedOpportunities ?? []).length === 0 ? (
        <p className="text-sm text-ink-4">
          Nothing saved yet — hit &quot;Save&quot; on any opportunity.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {savedOpportunities!.map((o) => (
            <div
              key={o.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1.5">
                  <CategoryBadge category={o.category} />
                </div>
                <Link
                  href={`/opportunity/${o.id}`}
                  className="block truncate font-display text-[15px] font-semibold text-ink hover:text-accent"
                >
                  {o.title}
                </Link>
                <div className="text-[13px] text-ink-4">
                  {o.organization} · {formatDeadlineFull(o.deadline)}
                </div>
              </div>
              <StatusSelect opportunityId={o.id} status={statusByOpportunityId.get(o.id) ?? "saved"} />
              <form action={unsaveOpportunity.bind(null, o.id)}>
                <button
                  type="submit"
                  className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-xs font-semibold text-ink-4 hover:text-danger-ink"
                >
                  Unsave
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
