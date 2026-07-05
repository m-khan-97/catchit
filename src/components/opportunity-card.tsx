import Link from "next/link";
import type { PublicOpportunity } from "@/lib/supabase/types";
import { CategoryBadge } from "./category-badge";
import { UrgencyBadge } from "./urgency-badge";

// Below this, "N saved" reads as noise rather than signal — most items
// won't clear it yet, and that's fine, it's meant to surface real traction.
const SAVE_COUNT_DISPLAY_THRESHOLD = 3;

export function OpportunityCard({
  opportunity,
  savedCount,
  matchesYou,
}: {
  opportunity: PublicOpportunity;
  savedCount?: number;
  matchesYou?: boolean;
}) {
  return (
    <Link
      href={`/opportunity/${opportunity.id}`}
      className="block rounded-[18px] border border-border bg-surface p-[18px_19px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-[transform,box-shadow,border-color] duration-150 ease-out hover:-translate-y-0.5 hover:border-focus hover:shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <CategoryBadge category={opportunity.category} />
        <UrgencyBadge deadline={opportunity.deadline} />
        {matchesYou && (
          <span className="rounded-full bg-ok-bg px-2 py-0.5 text-[11.5px] font-semibold text-ok">
            ✓ Matches you
          </span>
        )}
        {savedCount !== undefined && savedCount >= SAVE_COUNT_DISPLAY_THRESHOLD && (
          <span className="text-[12px] font-semibold text-ink-4">🔥 {savedCount} saved</span>
        )}
      </div>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 font-display text-[19px] leading-tight font-semibold tracking-[-0.018em] text-ink">
            {opportunity.title}
          </h3>
          <div className="mb-2 text-[13.5px] font-medium text-ink-4">
            {opportunity.organization} · {opportunity.region_tags.join(", ") || "Region unspecified"}
          </div>
          <p className="text-[14.5px] leading-snug text-ink-2">{opportunity.snippet}</p>
        </div>
        <span className="mt-px flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm text-ink">
          →
        </span>
      </div>
    </Link>
  );
}
