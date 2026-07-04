import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOpportunityById } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { CategoryBadge } from "@/components/category-badge";
import { UrgencyBadge } from "@/components/urgency-badge";
import { formatDeadlineFull, hostOf } from "@/lib/opportunities/format";
import { CATEGORY_LABELS } from "@/lib/supabase/types";
import { saveOpportunity, unsaveOpportunity } from "@/app/account/actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const opportunity = await getOpportunityById(id);
  if (!opportunity) return { title: "Not found" };

  const deadlineText = formatDeadlineFull(opportunity.deadline);
  const description = `${opportunity.organization} · ${CATEGORY_LABELS[opportunity.category]} · ${deadlineText}. ${opportunity.snippet}`;

  return {
    title: opportunity.title,
    description,
    openGraph: {
      title: opportunity.title,
      description,
      type: "article",
    },
  };
}

export default async function OpportunityPage({ params }: PageProps) {
  const { id } = await params;
  const sel = await getOpportunityById(id);
  if (!sel) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isSaved = false;
  if (user) {
    const { data } = await supabase
      .from("saved_opportunities")
      .select("id")
      .eq("user_id", user.id)
      .eq("opportunity_id", sel.id)
      .maybeSingle();
    isSaved = Boolean(data);
  }

  const region = sel.region_tags.join(", ") || "Region unspecified";

  return (
    <section>
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink-2"
      >
        ← Back to radar
      </Link>

      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <CategoryBadge category={sel.category} />
        <UrgencyBadge deadline={sel.deadline} />
        <div className="ml-auto">
          {user ? (
            <form action={(isSaved ? unsaveOpportunity : saveOpportunity).bind(null, sel.id)}>
              <button
                type="submit"
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] font-semibold text-ink-3 hover:text-ink"
              >
                {isSaved ? "★ Saved" : "☆ Save"}
              </button>
            </form>
          ) : (
            <Link
              href={`/login?next=/opportunity/${sel.id}`}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] font-semibold text-ink-3 hover:text-ink"
            >
              Sign in to save
            </Link>
          )}
        </div>
      </div>

      <h1 className="mb-2 font-display text-[29px] leading-[1.14] font-bold tracking-[-0.02em] text-ink">
        {sel.title}
      </h1>
      <div className="mb-6 text-[15px] text-ink-4">
        {sel.organization} · {region}
      </div>

      <div className="mb-6.5 grid grid-cols-2 gap-2.5">
        <div className="rounded-[13px] border border-border bg-surface p-[15px]">
          <div className="mb-1 text-[11.5px] tracking-[0.06em] text-ink-5 uppercase">Deadline</div>
          <div className="font-display text-base font-semibold text-ink">
            {formatDeadlineFull(sel.deadline)}
          </div>
          {sel.deadline_note && (
            <div className="mt-1 text-[12.5px] text-ink-4">{sel.deadline_note}</div>
          )}
        </div>
        <div className="rounded-[13px] border border-border bg-surface p-[15px]">
          <div className="mb-1 text-[11.5px] tracking-[0.06em] text-ink-5 uppercase">Region</div>
          <div className="font-display text-base font-semibold text-ink">{region}</div>
        </div>
      </div>

      <h2 className="mb-2 font-display text-base font-semibold text-ink">About this opportunity</h2>
      <p className="mb-6 text-[15.5px] leading-relaxed text-ink-2">{sel.description}</p>

      {sel.eligibility.length > 0 && (
        <>
          <h2 className="mb-2.5 font-display text-base font-semibold text-ink">Who&apos;s eligible</h2>
          <div className="mb-7.5 flex flex-col gap-2">
            {sel.eligibility.map((e, i) => (
              <div key={i} className="flex items-start gap-2.5 text-[15px] leading-snug text-ink-2">
                <span className="mt-px text-ok">✓</span>
                {e}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="sticky bottom-4 rounded-2xl bg-header-bg backdrop-blur-sm">
        <a
          href={sel.url}
          target="_blank"
          rel="noopener noreferrer"
          data-umami-event="apply_click"
          data-umami-event-category={sel.category}
          className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-accent p-4 font-display text-base font-bold text-accent-ink hover:bg-accent-hover"
        >
          Apply at {hostOf(sel.url)} <span className="text-sm">↗</span>
        </a>
        <div className="px-0 pt-2.5 pb-0 text-center text-[12.5px] text-ink-4">
          Applications always happen on the original site — we just point you there.
        </div>
      </div>
    </section>
  );
}
