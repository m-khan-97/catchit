import { NextResponse, type NextRequest } from "next/server";
import { runDigest } from "@/lib/email/digest";
import { sendCronFailureAlert } from "@/lib/discord";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runDigest();
    return NextResponse.json(summary);
  } catch (err) {
    await sendCronFailureAlert("Digest", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
