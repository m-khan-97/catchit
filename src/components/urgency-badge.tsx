import { urgencyOf } from "@/lib/opportunities/urgency";
import { URGENCY_STYLES } from "@/lib/opportunities/styles";

export function UrgencyBadge({ deadline }: { deadline: string | null }) {
  const urgency = urgencyOf(deadline);
  const style = URGENCY_STYLES[urgency.level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-tight ${style.bg} ${style.fg} ${style.bordered ? "border border-border" : ""}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot} ${style.pulse ? "animate-opp-pulse" : ""}`} />
      {urgency.text}
    </span>
  );
}
