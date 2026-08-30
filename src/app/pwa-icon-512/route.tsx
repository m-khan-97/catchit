import { radarIconResponse } from "@/lib/radar-icon";

// See pwa-icon-192: nothing per-request to render, so prerender it.
export const dynamic = "force-static";

export function GET() {
  return radarIconResponse(512);
}
