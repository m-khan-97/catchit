import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms of using CatchIt, in plain language.",
};

export default function TermsPage() {
  return (
    <section className="max-w-[600px]">
      <h1 className="mb-2 font-display text-[29px] leading-[1.16] font-bold tracking-[-0.02em] text-ink">
        Terms of use
      </h1>
      <p className="mb-8 text-[13.5px] text-ink-4">Last updated: July 2026</p>

      <div className="flex flex-col gap-6 text-[15.5px] leading-relaxed text-ink-2">
        <div>
          <h2 className="mb-2 font-display text-base font-semibold text-ink">What CatchIt is</h2>
          <p>
            CatchIt surfaces opportunities — hackathons, scholarships, internships, vouchers,
            events, and calls for papers — published by third parties. We point you to the
            original source; we don&apos;t run the opportunities themselves, and applying always
            happens on the organizer&apos;s own site.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-base font-semibold text-ink">Accuracy, honestly</h2>
          <p>
            We work hard to keep listings accurate — every item passes human review, deadlines are
            checked against sources, and links are re-verified automatically. But deadlines get
            extended, pages move, and organizers change their minds. <strong className="text-ink">
            Always confirm details on the original site before relying on them.</strong> We
            can&apos;t accept liability for a missed deadline, a changed eligibility rule, or an
            opportunity that turned out differently than listed.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-base font-semibold text-ink">Submissions</h2>
          <p>
            When you submit an opportunity, you confirm the information is accurate to your
            knowledge and that you have the right to share it. Submissions are reviewed before
            publication, and we may edit them for clarity or decline them without explanation.
            Don&apos;t submit spam, scams, or anything requiring payment to &quot;apply&quot; —
            these are removed and repeat sources blocked.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-base font-semibold text-ink">Using our data</h2>
          <p>
            The public feed and JSON API are free to use and embed for non-commercial purposes —
            student societies, university pages, and course sites are exactly what they&apos;re
            for. We ask for a visible link back to CatchIt. For commercial use of the API or
            data, get in touch first.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-base font-semibold text-ink">Fair use</h2>
          <p>
            Don&apos;t scrape at rates the API doesn&apos;t offer, attempt to access the admin
            area, misrepresent CatchIt as your own service, or use the platform to distribute
            anything unlawful. We may restrict access to protect the service for everyone else.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-base font-semibold text-ink">Changes</h2>
          <p>
            We may update these terms as the product evolves — material changes will be noted on
            this page with a new date. Continued use after a change means you accept the updated
            terms.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-base font-semibold text-ink">Contact</h2>
          <p>
            Questions, takedown requests, or anything else:{" "}
            <a href="mailto:ibrahim.logix@gmail.com" className="underline">
              ibrahim.logix@gmail.com
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
