import { NextResponse, type NextRequest } from "next/server";
import { runLinkCheck } from "@/lib/link-check";
import { sweepExpiredPending } from "@/lib/expire-pending";
import { sendCronFailureAlert } from "@/lib/discord";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Housekeeping pair, operating on disjoint sets: the link check reads
    // approved rows, the sweep writes pending ones. Sweep first only
    // because it's a single cheap UPDATE, so a failure in the long
    // network-bound link check still leaves the queue tidied.
    const expiry = await sweepExpiredPending();
    const summary = await runLinkCheck();
    return NextResponse.json({ ...summary, expiredPending: expiry.expired });
  } catch (err) {
    await sendCronFailureAlert("Link check", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
