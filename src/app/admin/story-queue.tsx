"use client";

import { approveStory, rejectStory } from "./actions";
import type { Story } from "@/lib/supabase/types";

function StoryRow({ row }: { row: Story }) {
  return (
    <div className="flex items-start gap-3.5 border-b border-border-soft p-4">
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-semibold text-ink">
          {row.name}
          {row.role_line && <span className="font-normal text-ink-4"> · {row.role_line}</span>}
        </div>
        <p className="mt-1 text-[13.5px] leading-snug text-ink-2">{row.story}</p>
        {row.opportunity_url && (
          <a
            href={row.opportunity_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block truncate text-xs text-ink-4 underline"
          >
            {row.opportunity_url}
          </a>
        )}
      </div>
      <div className="flex flex-shrink-0 gap-1.5">
        <form action={approveStory.bind(null, row.id)}>
          <button
            type="submit"
            className="rounded-lg border border-ok bg-ok-bg px-3 py-1.5 text-[13px] font-semibold text-ok"
          >
            Approve
          </button>
        </form>
        <form action={rejectStory.bind(null, row.id)}>
          <button
            type="submit"
            className="rounded-lg border border-danger bg-danger-bg px-3 py-1.5 text-[13px] font-semibold text-danger-ink"
          >
            Reject
          </button>
        </form>
      </div>
    </div>
  );
}

export function StoryQueue({ stories }: { stories: Story[] }) {
  if (stories.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="mb-1 font-display text-lg font-semibold text-ink">
        Story submissions
      </h2>
      <p className="mb-3 text-[13.5px] text-ink-3">
        {stories.length} waiting for review · shown on /stories once approved.
      </p>
      <div className="overflow-hidden rounded-[13px] border border-border bg-surface">
        {stories.map((row) => (
          <StoryRow key={row.id} row={row} />
        ))}
      </div>
    </div>
  );
}
