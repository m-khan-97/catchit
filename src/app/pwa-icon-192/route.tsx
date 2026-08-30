import { radarIconResponse } from "@/lib/radar-icon";

// The mark is derived purely from `size`, so there is nothing per-request to
// render. Without this the route generated a PNG on every hit — and manifest
// icons get fetched by installs, crawlers and link unfurlers alike.
export const dynamic = "force-static";

export function GET() {
  return radarIconResponse(192);
}
