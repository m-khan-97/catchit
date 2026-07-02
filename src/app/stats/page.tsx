import type { Metadata } from "next";
import { getStats } from "@/lib/supabase/queries";

export const metadata: Metadata = {
  title: "Stats",
  description: "A quick, honest snapshot of what's flowed through CatchIt so far.",
};

export default async function StatsPage() {
  const stats = await getStats();

  const tiles = [
    { value: stats.total, label: "Opportunities posted to date" },
    { value: stats.live, label: "Currently live" },
    { value: stats.closingSoon, label: "Closing within a week" },
    { value: stats.sources, label: "Sources represented" },
  ];

  return (
    <section>
      <h1 className="mb-1.5 font-display text-[28px] font-bold tracking-[-0.02em] text-ink">
        The radar, by the numbers
      </h1>
      <p className="mb-7 text-[15.5px] text-ink-3">
        A quick, honest snapshot of what&apos;s flowed through so far.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-2xl border border-border bg-surface px-5 py-5.5">
            <div className="font-display text-[34px] leading-none font-bold tracking-[-0.02em] text-ink">
              {tile.value.toLocaleString()}
            </div>
            <div className="mt-1.5 text-sm text-ink-3">{tile.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
