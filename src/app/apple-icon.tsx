import { radarIconResponse } from "@/lib/radar-icon";

// Next.js's apple-icon convention auto-injects the <link rel="apple-touch-icon">
// tag — iOS Safari ignores the web manifest entirely for home-screen icons,
// so without this file "Add to Home Screen" falls back to a screenshot thumbnail.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return radarIconResponse(180);
}
