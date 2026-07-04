import { createEvents, type EventAttributes } from "ics";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface CalendarOpportunity {
  id: string;
  title: string;
  organization: string;
  url: string;
  deadline: string | null;
  deadline_note: string | null;
  category: string;
  region_tags: string[];
  audience_tags: string[];
}

interface FilterLike {
  categories: string[];
  regions: string[];
  audiences: string[];
}

function matchesFilter(o: CalendarOpportunity, f: FilterLike): boolean {
  if (f.categories.length > 0 && !f.categories.includes(o.category)) return false;
  if (f.regions.length > 0 && !o.region_tags.some((r) => f.regions.includes(r))) return false;
  if (f.audiences.length > 0 && !o.audience_tags.some((a) => f.audiences.includes(a))) return false;
  return true;
}

const CALENDAR_COLUMNS = "id,title,organization,url,deadline,deadline_note,category,region_tags,audience_tags";

/**
 * With no token: every approved opportunity that has a deadline — the
 * public feed's calendar export. With `?token=`: only that user's saved
 * items + anything matching one of their followed filters — the
 * personal-account feed. An unrecognized token yields an empty (not
 * error, not full-feed) calendar — wrong is quiet, not a privacy leak.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  let opportunities: CalendarOpportunity[] = [];

  if (token) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("calendar_token", token)
      .maybeSingle();

    if (profile) {
      const [{ data: savedRows }, { data: filters }, { data: allOpportunities }] = await Promise.all([
        admin.from("saved_opportunities").select("opportunity_id").eq("user_id", profile.id),
        admin.from("followed_filters").select("*").eq("user_id", profile.id),
        admin
          .from("opportunities_public")
          .select(CALENDAR_COLUMNS)
          .not("deadline", "is", null)
          .order("deadline", { ascending: true }),
      ]);

      const savedIds = new Set((savedRows ?? []).map((r) => r.opportunity_id));
      const filterList = filters ?? [];

      opportunities = (allOpportunities ?? []).filter(
        (o) => savedIds.has(o.id) || filterList.some((f) => matchesFilter(o, f))
      );
    }
  } else {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("opportunities_public")
      .select(CALENDAR_COLUMNS)
      .not("deadline", "is", null)
      .order("deadline", { ascending: true });

    if (error) {
      return new Response("Failed to load calendar feed", { status: 500 });
    }
    opportunities = data ?? [];
  }

  const events: EventAttributes[] = opportunities.map((o) => {
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
    calName: token ? "CatchIt — my deadlines" : "CatchIt deadlines",
    productId: "-//CatchIt//Opportunity Deadlines//EN",
  });

  if (icsError || !value) {
    return new Response("Failed to build calendar feed", { status: 500 });
  }

  return new Response(value, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": token ? "private, max-age=300" : "public, max-age=1800",
    },
  });
}
