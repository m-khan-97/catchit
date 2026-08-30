import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/server";

// Crawlers re-fetch this constantly, and it was rebuilt from the database
// every time. An hour-old sitemap is fine for search engines.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const supabase = createPublicClient();
  const { data } = await supabase.from("opportunities_public").select("id, discovered_at");

  const staticRoutes: MetadataRoute.Sitemap = ["", "/submit", "/stats", "/about"].map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: "daily",
    priority: path === "" ? 1 : 0.6,
  }));

  const opportunityRoutes: MetadataRoute.Sitemap = (data ?? []).map((o) => ({
    url: `${siteUrl}/opportunity/${o.id}`,
    lastModified: o.discovered_at,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...opportunityRoutes];
}
