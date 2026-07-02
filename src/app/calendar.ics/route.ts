import { createEvents, type EventAttributes } from "ics";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities_public")
    .select("id,title,organization,url,deadline,deadline_note")
    .not("deadline", "is", null)
    .order("deadline", { ascending: true });

  if (error) {
    return new Response("Failed to load calendar feed", { status: 500 });
  }

  const events: EventAttributes[] = (data ?? []).map((o) => {
    const d = new Date(o.deadline!);
    return {
      uid: `${o.id}@catchit`,
      title: `Deadline: ${o.title}`,
      description: [o.organization, o.deadline_note, o.url].filter(Boolean).join("\n"),
      start: [
        d.getUTCFullYear(),
        d.getUTCMonth() + 1,
        d.getUTCDate(),
        d.getUTCHours(),
        d.getUTCMinutes(),
      ],
      startInputType: "utc",
      startOutputType: "utc",
      duration: { hours: 1 },
      url: o.url,
    };
  });

  const { error: icsError, value } = createEvents(events, {
    calName: "CatchIt deadlines",
    productId: "-//CatchIt//Opportunity Deadlines//EN",
  });

  if (icsError || !value) {
    return new Response("Failed to build calendar feed", { status: 500 });
  }

  return new Response(value, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=1800",
    },
  });
}
