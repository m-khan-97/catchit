export type UrgencyLevel = "soon" | "later" | "ongoing" | "closed";

export interface Urgency {
  level: UrgencyLevel;
  text: string;
}

/**
 * Mirrors the CatchIt mockup's urgency thresholds: under 72h is "soon"
 * (shown in hours below 48h, days above), 14+ days rounds to weeks, no
 * deadline is "ongoing". Adds a "closed" state for approved items whose
 * deadline has passed but are still reachable via a direct/shared link.
 */
export function urgencyOf(deadline: string | null, now: Date = new Date()): Urgency {
  if (!deadline) return { level: "ongoing", text: "Ongoing" };

  const hoursLeft = (new Date(deadline).getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursLeft <= 0) return { level: "closed", text: "Closed" };

  if (hoursLeft < 72) {
    const text =
      hoursLeft < 48 ? `${Math.round(hoursLeft)}h left` : `${Math.round(hoursLeft / 24)} days left`;
    return { level: "soon", text };
  }

  const days = Math.round(hoursLeft / 24);
  const text = days >= 14 ? `${Math.round(days / 7)} weeks left` : `${days} days left`;
  return { level: "later", text };
}
