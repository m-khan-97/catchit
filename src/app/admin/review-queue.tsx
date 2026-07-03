"use client";

import { useState, useTransition } from "react";
import { approveOpportunity, rejectOpportunity, saveAndApprove, bulkApprove, bulkReject } from "./actions";
import { OpportunityEditForm } from "./opportunity-edit-form";
import { CATEGORY_LABELS, type Opportunity } from "@/lib/supabase/types";

function metaLine(row: Opportunity): string {
  const category = CATEGORY_LABELS[row.category];
  if (row.source === "user-submitted") {
    return `${row.organization} · ${category} · flagged by ${row.submitter_email ?? "a student"}`;
  }
  return `${row.organization} · ${category} · ${row.source}`;
}

function QueueRow({
  row,
  checked,
  onToggle,
}: {
  row: Opportunity;
  checked: boolean;
  onToggle: () => void;
}) {
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
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        aria-label={`Select ${row.title}`}
        className="size-4 shrink-0 accent-accent"
      />
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  if (queue.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-16 text-center text-ink-4">
        Nothing pending — the queue is clear.
      </div>
    );
  }

  const allSelected = selected.size > 0 && selected.size === queue.length;

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(queue.map((r) => r.id)));
  }

  function runBulk(action: (ids: string[]) => Promise<void>, confirmMessage: string) {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!window.confirm(confirmMessage.replace("{n}", String(ids.length)))) return;
    startTransition(async () => {
      await action(ids);
      setSelected(new Set());
    });
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-3 rounded-[13px] border border-border bg-surface px-4 py-2.5">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          aria-label="Select all"
          className="size-4 accent-accent"
        />
        <span className="text-[13px] font-semibold text-ink-3">
          {selected.size > 0 ? `${selected.size} selected` : "Select all"}
        </span>
        {selected.size > 0 && (
          <div className="ml-auto flex gap-1.5">
            <button
              disabled={isPending}
              onClick={() =>
                runBulk(bulkApprove, "Approve {n} opportunities? This publishes them live and notifies Discord.")
              }
              className="rounded-lg border border-ok bg-ok-bg px-3 py-1.5 text-[13px] font-semibold text-ok disabled:opacity-60"
            >
              Approve selected
            </button>
            <button
              disabled={isPending}
              onClick={() => runBulk(bulkReject, "Reject {n} opportunities?")}
              className="rounded-lg border border-danger bg-danger-bg px-3 py-1.5 text-[13px] font-semibold text-danger-ink disabled:opacity-60"
            >
              Reject selected
            </button>
          </div>
        )}
      </div>
      <div className="overflow-hidden rounded-[13px] border border-border bg-surface">
        {queue.map((row) => (
          <QueueRow
            key={row.id}
            row={row}
            checked={selected.has(row.id)}
            onToggle={() => toggleRow(row.id)}
          />
        ))}
      </div>
    </div>
  );
}
