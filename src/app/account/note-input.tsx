"use client";

import { useTransition } from "react";
import { setSavedNote } from "./actions";

export function NoteInput({ opportunityId, note }: { opportunityId: string; note: string }) {
  const [pending, startTransition] = useTransition();

  function onBlur(e: React.FocusEvent<HTMLInputElement>) {
    const next = e.target.value;
    if (next === note) return;
    startTransition(async () => {
      await setSavedNote(opportunityId, next);
    });
  }

  return (
    <input
      type="text"
      defaultValue={note}
      onBlur={onBlur}
      placeholder="Add a note…"
      disabled={pending}
      maxLength={500}
      className="w-full rounded-lg border border-border bg-bg px-2.5 py-1 text-xs text-ink-3 placeholder:text-ink-5 disabled:opacity-60"
    />
  );
}
