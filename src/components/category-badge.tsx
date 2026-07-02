import { CATEGORY_LABELS, type OpportunityCategory } from "@/lib/supabase/types";
import { CATEGORY_STYLES } from "@/lib/opportunities/styles";

export function CategoryBadge({ category }: { category: OpportunityCategory }) {
  const style = CATEGORY_STYLES[category];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-tight ${style.bg} ${style.fg}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {CATEGORY_LABELS[category]}
    </span>
  );
}
