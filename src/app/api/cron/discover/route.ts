import { NextResponse, type NextRequest } from "next/server";
import { runDiscovery, AI_SEARCH_CATEGORIES } from "@/lib/discovery/run";
import { sendCronFailureAlert } from "@/lib/discord";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ?categories=academic,startup restricts AI search to those categories and
  // bypasses the low-churn day gate — for backfilling a newly added category
  // without paying for a full run. Scheduled Vercel Cron calls omit it and
  // get the normal cadence. Unknown names are rejected rather than silently
  // producing an empty run that still looks like a success.
  const raw = request.nextUrl.searchParams.get("categories");
  let onlyCategories: string[] | undefined;
  if (raw !== null) {
    onlyCategories = raw.split(",").map((c) => c.trim()).filter(Boolean);
    const unknown = onlyCategories.filter(
      (c) => !(AI_SEARCH_CATEGORIES as readonly string[]).includes(c)
    );
    if (onlyCategories.length === 0 || unknown.length > 0) {
      return NextResponse.json(
        {
          error: unknown.length > 0 ? `Unknown categories: ${unknown.join(", ")}` : "No categories given",
          valid: AI_SEARCH_CATEGORIES,
        },
        { status: 400 }
      );
    }
  }

  try {
    const summary = await runDiscovery({ onlyCategories });
    return NextResponse.json(summary);
  } catch (err) {
    await sendCronFailureAlert("Discovery", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
