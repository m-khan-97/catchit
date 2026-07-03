import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Unsubscribed",
  robots: { index: false },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let removed = false;
  if (token && UUID_RE.test(token)) {
    const supabase = createAdminClient();
    // Delete, not flag — per the privacy policy, unsubscribing removes
    // the record entirely.
    const { data } = await supabase
      .from("subscribers")
      .delete()
      .eq("unsubscribe_token", token)
      .select("id")
      .maybeSingle();
    removed = Boolean(data);
  }

  return (
    <section className="mx-auto max-w-[440px] pt-10 text-center">
      {removed ? (
        <>
          <h1 className="mb-2 font-display text-2xl font-bold text-ink">You&apos;re unsubscribed</h1>
          <p className="mb-6 text-[15.5px] leading-relaxed text-ink-3">
            Your email has been deleted from our list — not archived, deleted. The radar is
            always here if you want to browse without the inbox.
          </p>
        </>
      ) : (
        <>
          <h1 className="mb-2 font-display text-2xl font-bold text-ink">Already done</h1>
          <p className="mb-6 text-[15.5px] leading-relaxed text-ink-3">
            That unsubscribe link is invalid or was already used — either way, this email
            isn&apos;t on our list.
          </p>
        </>
      )}
      <Link
        href="/"
        className="inline-block rounded-xl bg-accent px-5 py-2.5 font-display text-[15px] font-bold text-accent-ink"
      >
        Back to the radar
      </Link>
    </section>
  );
}
