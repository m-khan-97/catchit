import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CatchIt — catch it before it's gone",
    short_name: "CatchIt",
    description:
      "Hackathons, free credits, scholarships, and conference & journal CFPs — surfaced while there's still time to act.",
    start_url: "/",
    id: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0F100C",
    theme_color: "#0F100C",
    icons: [
      { src: "/pwa-icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon-192", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/pwa-icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Submit an opportunity", url: "/submit" },
      { name: "My saved items", url: "/account" },
    ],
  };
}
