import type { Metadata } from "next";
import { Space_Grotesk, Instrument_Sans } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CatchIt — catch it before it's gone",
    template: "%s · CatchIt",
  },
  description:
    "Hackathons, free credits, scholarships, and conference & journal CFPs — surfaced while there's still time to act.",
};

// Runs before paint so the saved theme applies with no flash of the wrong
// theme. Reads localStorage only — nothing user-supplied is interpolated.
const themeInitScript = `
(function () {
  try {
    var saved = localStorage.getItem('catchit-theme');
    if (saved === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (e) {}
})();
`;

const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${instrumentSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {umamiWebsiteId && (
          <script defer src="https://cloud.umami.is/script.js" data-website-id={umamiWebsiteId} />
        )}
      </head>
      <body className="min-h-full flex flex-col bg-bg font-sans text-ink" suppressHydrationWarning>
        <Header />
        <main className="mx-auto w-full max-w-[820px] flex-1 px-5 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
