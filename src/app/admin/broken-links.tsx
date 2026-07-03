"use client";

import { useState } from "react";
import { unpublishOpportunity, updateApprovedOpportunity } from "./actions";
import { OpportunityEditForm } from "./opportunity-edit-form";
import { CATEGORY_LABELS, type Opportunity } from "@/lib/supabase/types";

function metaLine(row: Opportunity): string {
  const checked = row.last_checked_at
    ? new Date(row.last_checked_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      })
    : "never";
  return `${row.organization} · ${CATEGORY_LABELS[row.category]} · last checked ${checked}`;
}

function BrokenLinkRow({ row }: { row: Opportunity }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <OpportunityEditForm
        row={row}
        action={updateApprovedOpportunity.bind(null, row.id)}
        submitLabel="Save changes"
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex items-center gap-3.5 border-b border-border-soft p-4">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14.5px] font-semibold text-ink">{row.title}</div>
        <div className="mt-0.5 truncate text-xs text-ink-4">{metaLine(row)}</div>
        <a
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-0.5 block truncate text-xs text-danger-ink underline"
        >
          {row.url}
        </a>
      </div>
      <div className="flex flex-shrink-0 gap-1.5">
        <button
          onClick={() => setEditing(true)}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] font-semibold text-ink-3"
        >
          Fix
        </button>
        <form action={unpublishOpportunity.bind(null, row.id)}>
          <button
            type="submit"
            className="rounded-lg border border-danger bg-danger-bg px-3 py-1.5 text-[13px] font-semibold text-danger-ink"
          >
            Unpublish
          </button>
        </form>
      </div>
    </div>
  );
}

export function BrokenLinks({ items }: { items: Opportunity[] }) {
  if (items.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="mb-1 font-display text-lg font-semibold text-ink">Broken links</h2>
      <p className="mb-3 text-[13.5px] text-ink-3">
        These are live on the public feed but failed the last link check — fix the URL or pull
        them.
      </p>
      <div className="overflow-hidden rounded-[13px] border border-danger bg-surface">
        {items.map((row) => (
          <BrokenLinkRow key={row.id} row={row} />
        ))}
      </div>
    </div>
  );
}
