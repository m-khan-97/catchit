"use client";

import { useTransition } from "react";
import { setApplicationStatus } from "./actions";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS, type ApplicationStatus } from "@/lib/supabase/types";

export function StatusSelect({
  opportunityId,
  status,
}: {
  opportunityId: string;
  status: ApplicationStatus;
}) {
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    startTransition(async () => {
      await setApplicationStatus(opportunityId, next);
    });
  }

  return (
    <select
      value={status}
      onChange={onChange}
      disabled={pending}
      className="rounded-lg border border-border bg-bg px-2 py-1 text-xs font-semibold text-ink-3 disabled:opacity-60"
    >
      {APPLICATION_STATUSES.map((s) => (
        <option key={s} value={s}>
          {APPLICATION_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
