import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Confirm subscription",
  robots: { index: false },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let confirmed = false;
  if (token && UUID_RE.test(token)) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("subscribers")
      .update({ confirmed_at: new Date().toISOString() })
      .eq("confirm_token", token)
      .select("id")
      .maybeSingle();
    confirmed = Boolean(data);
  }

  return (
    <section className="mx-auto max-w-[440px] pt-10 text-center">
      {confirmed ? (
        <>
          <div className="mx-auto mb-4.5 flex h-14 w-14 items-center justify-center rounded-full bg-ok-bg text-2xl text-ok">
            ✓
          </div>
          <h1 className="mb-2 font-display text-2xl font-bold text-ink">You&apos;re on the radar</h1>
          <p className="mb-6 text-[15.5px] leading-relaxed text-ink-3">
            The weekly digest will land in your inbox — new opportunities and closing deadlines,
            every week. Every email has a one-click unsubscribe.
          </p>
        </>
      ) : (
        <>
          <h1 className="mb-2 font-display text-2xl font-bold text-ink">
            That link didn&apos;t work
          </h1>
          <p className="mb-6 text-[15.5px] leading-relaxed text-ink-3">
            The confirmation link is invalid or was already used. If you&apos;re trying to
            subscribe, sign up again from the feed and we&apos;ll send a fresh link.
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
