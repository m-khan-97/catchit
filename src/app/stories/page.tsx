import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { StoryForm } from "./story-form";

export const metadata: Metadata = {
  title: "Stories",
  description: "How CatchIt helped students and early-career people catch something before it was gone.",
};

const WALL_MIN_COUNT = 3;

// Tailwind class names written out in full (never templated) so the v4 JIT
// scanner can find them statically — see src/lib/opportunities/styles.ts.
const CARD_STYLES = [
  { border: "border-t-cat-hackathon-dot", avatar: "bg-cat-hackathon-dot", quote: "text-cat-hackathon-dot/15" },
  { border: "border-t-cat-voucher-dot", avatar: "bg-cat-voucher-dot", quote: "text-cat-voucher-dot/15" },
  { border: "border-t-cat-event-dot", avatar: "bg-cat-event-dot", quote: "text-cat-event-dot/15" },
  { border: "border-t-cat-scholarship-dot", avatar: "bg-cat-scholarship-dot", quote: "text-cat-scholarship-dot/15" },
  { border: "border-t-cat-internship-dot", avatar: "bg-cat-internship-dot", quote: "text-cat-internship-dot/15" },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "")).toUpperCase();
}

export default async function StoriesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stories_public")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (error) throw error;

  const stories = data ?? [];
  const showWall = stories.length >= WALL_MIN_COUNT;

  return (
    <section>
      <div className="mb-3.5 text-[12.5px] tracking-[0.08em] text-ink-5 uppercase">
        Real catches
      </div>
      <h1 className="mb-5.5 font-display text-[29px] leading-[1.16] font-bold tracking-[-0.02em] text-ink">
        Nobody made this up.{" "}
        <span className="bg-[linear-gradient(180deg,transparent_80%,var(--color-accent)_80%)] px-px">
          These are real catches.
        </span>
      </h1>
      <p className="mb-8 max-w-[56ch] text-base leading-relaxed text-ink-2">
        Hackathon spots, free credits, scholarships — students and early-career people share what
        CatchIt helped them not miss. Every story below is read and approved by a human before it
        goes up.
      </p>

      {showWall && (
        <div className="mb-9 columns-1 gap-3 sm:columns-2 lg:columns-3">
          {stories.map((s, i) => {
            const style = CARD_STYLES[i % CARD_STYLES.length];
            const tilt = i % 2 === 0 ? "rotate-[-0.6deg]" : "rotate-[0.6deg]";
            return (
              <div
                key={s.id}
                className={`animate-card-fade-in group relative mb-3 break-inside-avoid overflow-hidden rounded-2xl border-x border-b border-t-[3px] border-x-border border-b-border bg-surface p-5 ${tilt} ${style.border} transition-transform duration-200 ease-out hover:-translate-y-1 hover:rotate-0 hover:shadow-[0_14px_32px_rgba(0,0,0,0.22)]`}
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute -top-3 left-3 font-display text-7xl font-bold ${style.quote}`}
                >
                  &ldquo;
                </span>
                <p className="relative mb-4 text-[15px] leading-relaxed text-ink-2">{s.story}</p>
                <div className="relative flex items-center gap-2.5">
                  <span
                    className={`flex size-9 flex-shrink-0 items-center justify-center rounded-full font-display text-[12.5px] font-bold text-[#14140E] ${style.avatar}`}
                  >
                    {initials(s.name)}
                  </span>
                  <div className="min-w-0">
                    <div className="font-display text-[14.5px] font-semibold text-ink">{s.name}</div>
                    {s.role_line && <div className="text-[12.5px] text-ink-4">{s.role_line}</div>}
                  </div>
                </div>
                {s.opportunity_url && (
                  <a
                    href={s.opportunity_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative mt-3 inline-block text-[13px] font-semibold text-ink underline hover:text-ink-2"
                  >
                    What they caught ↗
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="max-w-[560px]">
        <h2 className="mb-1.5 font-display text-lg font-bold text-ink">Share yours</h2>
        <p className="mb-4 text-[14.5px] text-ink-3">
          Thirty seconds — no login required.
        </p>
        <StoryForm />
      </div>
    </section>
  );
}
