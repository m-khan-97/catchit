import type { Metadata } from "next";

export const metadata: Metadata = { title: "You're offline" };

export default function OfflinePage() {
  return (
    <section className="mx-auto max-w-[440px] pt-16 text-center">
      <div className="mb-4 text-[34px]">📡</div>
      <h1 className="mb-2 font-display text-xl font-bold text-ink">
        No connection right now
      </h1>
      <p className="text-[15px] text-ink-3">
        CatchIt needs a connection to show live opportunities. Reconnect and reload — nothing you
        saved is lost.
      </p>
    </section>
  );
}
