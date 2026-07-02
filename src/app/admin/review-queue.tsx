"use client";

import { useState } from "react";
import { approveOpportunity, rejectOpportunity, saveAndApprove } from "./actions";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  AUDIENCE_TAGS,
  AUDIENCE_LABELS,
  type Opportunity,
} from "@/lib/supabase/types";

function metaLine(row: Opportunity): string {
  const category = CATEGORY_LABELS[row.category];
  if (row.source === "user-submitted") {
    return `${row.organization} · ${category} · flagged by ${row.submitter_email ?? "a student"}`;
  }
  return `${row.organization} · ${category} · ${row.source}`;
}

function QueueRow({ row }: { row: Opportunity }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    const saveAndApproveWithId = saveAndApprove.bind(null, row.id);
    return (
      <form action={saveAndApproveWithId} className="flex flex-col gap-3 border-b border-border-soft p-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink-2">Title</span>
            <input
              name="title"
              defaultValue={row.title}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink-2">Organization</span>
            <input
              name="organization"
              defaultValue={row.organization}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink-2">Category</span>
          <select
            name="category"
            defaultValue={row.category}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink-2">Deadline</span>
            <input
              type="date"
              name="deadline"
              defaultValue={row.deadline ? row.deadline.slice(0, 10) : ""}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink-2">Deadline note</span>
            <input
              name="deadline_note"
              defaultValue={row.deadline_note ?? ""}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink-2">
            Region tags <span className="font-normal text-ink-5">(comma-separated: UK, Remote, Global)</span>
          </span>
          <input
            name="region_tags"
            defaultValue={row.region_tags.join(", ")}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
        </label>

        <div>
          <span className="mb-1 block text-xs font-semibold text-ink-2">Audience</span>
          <div className="flex gap-3">
            {AUDIENCE_TAGS.map((a) => (
              <label key={a} className="flex items-center gap-1.5 text-sm text-ink-2">
                <input
                  type="checkbox"
                  name="audience_tags"
                  value={a}
                  defaultChecked={row.audience_tags.includes(a)}
                />
                {AUDIENCE_LABELS[a]}
              </label>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink-2">Link</span>
          <input
            name="url"
            defaultValue={row.url}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink-2">Snippet (feed card)</span>
          <textarea
            name="snippet"
            defaultValue={row.snippet}
            rows={2}
            className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink-2">Description (detail page)</span>
          <textarea
            name="description"
            defaultValue={row.description}
            rows={3}
            className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink-2">
            Eligibility <span className="font-normal text-ink-5">(one per line)</span>
          </span>
          <textarea
            name="eligibility"
            defaultValue={row.eligibility.join("\n")}
            rows={3}
            className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
        </label>

        <div className="flex gap-2">
          <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">
            Save &amp; approve
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink-3"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3.5 border-b border-border-soft p-4">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14.5px] font-semibold text-ink">{row.title}</div>
        <div className="mt-0.5 text-xs text-ink-4">{metaLine(row)}</div>
      </div>
      <div className="flex gap-1.5">
        <form action={approveOpportunity.bind(null, row.id)}>
          <button
            type="submit"
            className="rounded-lg border border-ok bg-ok-bg px-3 py-1.5 text-[13px] font-semibold text-ok"
          >
            Approve
          </button>
        </form>
        <form action={rejectOpportunity.bind(null, row.id)}>
          <button
            type="submit"
            className="rounded-lg border border-danger bg-danger-bg px-3 py-1.5 text-[13px] font-semibold text-danger-ink"
          >
            Reject
          </button>
        </form>
        <button
          onClick={() => setEditing(true)}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] font-semibold text-ink-3"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

export function ReviewQueue({ queue }: { queue: Opportunity[] }) {
  if (queue.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-16 text-center text-ink-4">
        Nothing pending — the queue is clear.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[13px] border border-border bg-surface">
      {queue.map((row) => (
        <QueueRow key={row.id} row={row} />
      ))}
    </div>
  );
}
