import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    // Filtered views are duplicate content — the same opportunities sliced a
    // different way — so they earn nothing from being indexed while giving a
    // crawler a large permutation space to walk. Every page worth finding
    // (the feed, each opportunity, the static pages) has a clean query-free
    // URL and is listed in the sitemap.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/*?"] }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
