import { NextResponse, type NextRequest } from "next/server";
import { runDeadlineAlerts } from "@/lib/email/deadline-alerts";
import { sendCronFailureAlert } from "@/lib/discord";

export const maxDuration = 120;

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runDeadlineAlerts();
    return NextResponse.json(summary);
  } catch (err) {
    await sendCronFailureAlert("Deadline alerts", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
