"use client";

import { useState } from "react";
import { approveOpportunity, rejectOpportunity, saveAndApprove } from "./actions";
import { OpportunityEditForm } from "./opportunity-edit-form";
import { CATEGORY_LABELS, type Opportunity } from "@/lib/supabase/types";

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
    return (
      <OpportunityEditForm
        row={row}
        action={saveAndApprove.bind(null, row.id)}
        submitLabel="Save & approve"
        onCancel={() => setEditing(false)}
      />
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
