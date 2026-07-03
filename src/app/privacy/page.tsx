import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What CatchIt collects, why, and what we never do with it.",
};

export default function PrivacyPage() {
  return (
    <section className="max-w-[600px]">
      <h1 className="mb-2 font-display text-[29px] leading-[1.16] font-bold tracking-[-0.02em] text-ink">
        Privacy
      </h1>
      <p className="mb-8 text-[13.5px] text-ink-4">Last updated: July 2026</p>

      <div className="flex flex-col gap-6 text-[15.5px] leading-relaxed text-ink-2">
        <div>
          <h2 className="mb-2 font-display text-base font-semibold text-ink">The short version</h2>
          <p>
            CatchIt is a radar for opportunities, not a data business. You can browse everything
            without an account, we don&apos;t use tracking cookies, and we never sell anyone&apos;s
            data to anyone. The only personal data we hold is what you explicitly hand us, and
            each piece is used for exactly one purpose.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-base font-semibold text-ink">What we collect, and why</h2>
          <ul className="flex list-disc flex-col gap-2 pl-5">
            <li>
              <strong className="text-ink">Submission emails (optional).</strong> If you submit an
              opportunity and choose to leave an email, we use it only to follow up about that
              submission. It is never shown publicly and never added to any mailing list.
            </li>
            <li>
              <strong className="text-ink">Digest emails.</strong> If you subscribe to the weekly
              digest, we store your email and your chosen filters to send you that digest — and
              nothing else. Every email includes a one-click unsubscribe that removes you
              immediately.
            </li>
            <li>
              <strong className="text-ink">Anonymous usage analytics.</strong> We count page views
              and clicks (e.g. which opportunities people open) using privacy-friendly analytics
              with no cookies, no cross-site tracking, and no way to identify you. That&apos;s why
              there&apos;s no cookie banner: there&apos;s nothing to consent to.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 font-display text-base font-semibold text-ink">What we never do</h2>
          <ul className="flex list-disc flex-col gap-2 pl-5">
            <li>Sell, rent, or share your personal data with third parties.</li>
            <li>Track you across other websites.</li>
            <li>Require an account or login to browse opportunities.</li>
            <li>Send you email you didn&apos;t explicitly opt into.</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 font-display text-base font-semibold text-ink">Where your data lives</h2>
          <p>
            Data is stored with our infrastructure providers: Supabase (database, hosted in the
            EU) and Vercel (hosting). Digest emails are delivered via Resend. Each processes data
            only on our instructions.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-base font-semibold text-ink">Retention</h2>
          <p>
            Submission emails are kept only as long as needed to review the submission, then
            removed. Digest subscriptions are kept until you unsubscribe, at which point the
            record is deleted. Anonymous analytics contain nothing to delete.
          </p>
        </div>

        <div>
          <h2 className="mb-2 font-display text-base font-semibold text-ink">Your rights</h2>
          <p>
            Under UK GDPR you can ask us what we hold about you, ask for it to be corrected, or
            ask for it to be deleted. Given the list above, the honest answer will usually be
            &quot;an email address, and it&apos;s gone now.&quot; Email{" "}
            <a href="mailto:ibrahim.logix@gmail.com" className="underline">
              ibrahim.logix@gmail.com
            </a>{" "}
            and we&apos;ll sort it quickly.
          </p>
        </div>
      </div>
    </section>
  );
}
