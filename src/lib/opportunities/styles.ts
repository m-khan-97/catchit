import type { OpportunityCategory } from "@/lib/supabase/types";
import type { UrgencyLevel } from "./urgency";

interface CategoryStyle {
  dot: string;
  bg: string;
  fg: string;
}

// Tailwind class names are written out in full (never templated) so the
// v4 JIT scanner can find them statically — see globals.css for the
// underlying --color-cat-* tokens.
export const CATEGORY_STYLES: Record<OpportunityCategory, CategoryStyle> = {
  hackathon: { dot: "bg-cat-hackathon-dot", bg: "bg-cat-hackathon-bg", fg: "text-cat-hackathon-fg" },
  voucher: { dot: "bg-cat-voucher-dot", bg: "bg-cat-voucher-bg", fg: "text-cat-voucher-fg" },
  event: { dot: "bg-cat-event-dot", bg: "bg-cat-event-bg", fg: "text-cat-event-fg" },
  scholarship: {
    dot: "bg-cat-scholarship-dot",
    bg: "bg-cat-scholarship-bg",
    fg: "text-cat-scholarship-fg",
  },
  internship: { dot: "bg-cat-internship-dot", bg: "bg-cat-internship-bg", fg: "text-cat-internship-fg" },
  conference: { dot: "bg-cat-conference-dot", bg: "bg-cat-conference-bg", fg: "text-cat-conference-fg" },
  journal: { dot: "bg-cat-journal-dot", bg: "bg-cat-journal-bg", fg: "text-cat-journal-fg" },
  other: { dot: "bg-cat-other-dot", bg: "bg-cat-other-bg", fg: "text-cat-other-fg" },
};

interface UrgencyStyle {
  dot: string;
  bg: string;
  fg: string;
  pulse: boolean;
  bordered: boolean;
}

export const URGENCY_STYLES: Record<UrgencyLevel, UrgencyStyle> = {
  soon: { dot: "bg-danger", bg: "bg-danger-bg", fg: "text-danger-ink", pulse: true, bordered: false },
  later: { dot: "bg-ink-5", bg: "bg-transparent", fg: "text-ink-4", pulse: false, bordered: true },
  ongoing: { dot: "bg-ok", bg: "bg-ok-bg", fg: "text-ok", pulse: false, bordered: false },
  closed: { dot: "bg-ink-5", bg: "bg-surface-2", fg: "text-ink-5", pulse: false, bordered: false },
};
