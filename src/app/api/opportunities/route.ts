import { NextResponse, type NextRequest } from "next/server";
import { getFeed } from "@/lib/supabase/queries";

/**
 * Read-only public feed as JSON, filterable the same way as the site's
 * feed (category/region/audience/q). Lets other pages — a Moodle/VLE
 * page, a student society site, another lecturer's course page — embed
 * live opportunities without scraping the HTML feed.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const data = await getFeed({
    category: searchParams.get("category") ?? undefined,
    region: searchParams.get("region") ?? undefined,
    audience: searchParams.get("audience") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  });

  return NextResponse.json(
    { opportunities: data },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
        // Public, read-only data with no auth/cookies involved — safe to
        // let any origin fetch it directly, which is the whole point.
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
