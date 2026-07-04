import { NextResponse, type NextRequest } from "next/server";
import { collectDiscoveryBatches } from "@/lib/discovery/run";
import { sendCronFailureAlert } from "@/lib/discord";

export const maxDuration = 120;

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await collectDiscoveryBatches();
    return NextResponse.json(summary);
  } catch (err) {
    await sendCronFailureAlert("Discovery batch collection", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
