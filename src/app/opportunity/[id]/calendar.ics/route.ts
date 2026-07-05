import { createEvents, type EventAttributes } from "ics";
import { getOpportunityById } from "@/lib/supabase/queries";

/** Single-event .ics for one opportunity's deadline — distinct from the
 * whole-feed / personal calendar subscriptions at /calendar.ics, which
 * are live-updating feeds rather than a one-off download. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await getOpportunityById(id);

  if (!o || !o.deadline) {
    return new Response("Not found", { status: 404 });
  }

  const d = new Date(o.deadline);
  const events: EventAttributes[] = [
    {
      uid: `${o.id}@catchit`,
      title: `Deadline: ${o.title}`,
      description: [o.organization, o.deadline_note, o.url].filter(Boolean).join("\n"),
      start: [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()],
      startInputType: "utc",
      startOutputType: "utc",
      duration: { hours: 1 },
      url: o.url,
    },
  ];

  const { error, value } = createEvents(events, {
    productId: "-//CatchIt//Opportunity Deadlines//EN",
  });

  if (error || !value) {
    return new Response("Failed to build calendar event", { status: 500 });
  }

  return new Response(value, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${o.id}.ics"`,
      "Cache-Control": "public, max-age=1800",
    },
  });
}
