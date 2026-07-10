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
const CARD_ACCENTS = [
  "border-t-cat-hackathon-dot",
  "border-t-cat-voucher-dot",
  "border-t-cat-event-dot",
  "border-t-cat-scholarship-dot",
  "border-t-cat-internship-dot",
];

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
        <div className="mb-9 columns-1 gap-3 sm:columns-2">
          {stories.map((s, i) => (
            <div
              key={s.id}
              className={`mb-3 break-inside-avoid rounded-2xl border-x border-b border-t-[3px] border-x-border border-b-border bg-surface p-5 ${CARD_ACCENTS[i % CARD_ACCENTS.length]}`}
            >
              <p className="mb-4 text-[15px] leading-relaxed text-ink-2">{s.story}</p>
              <div className="font-display text-[14.5px] font-semibold text-ink">{s.name}</div>
              {s.role_line && <div className="text-[13px] text-ink-4">{s.role_line}</div>}
              {s.opportunity_url && (
                <a
                  href={s.opportunity_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-[13px] font-semibold text-ink underline hover:text-ink-2"
                >
                  What they caught ↗
                </a>
              )}
            </div>
          ))}
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
