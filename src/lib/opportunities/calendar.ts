import type { PublicOpportunity } from "@/lib/supabase/types";

function formatUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/** Google Calendar's "quick add" event URL — no auth, no API key, just a
 * pre-filled form the user still has to hit save on themselves. */
export function googleCalendarUrl(o: PublicOpportunity): string {
  const start = new Date(o.deadline!);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const details = [o.organization, o.deadline_note, o.url].filter(Boolean).join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Deadline: ${o.title}`,
    dates: `${formatUtc(start)}/${formatUtc(end)}`,
    details,
    location: o.url,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
