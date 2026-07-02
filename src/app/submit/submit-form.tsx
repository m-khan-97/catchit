"use client";

import { useActionState, useState } from "react";
import { submitOpportunity, type SubmitState } from "./actions";
import { CATEGORIES, CATEGORY_LABELS, AUDIENCE_TAGS, AUDIENCE_LABELS } from "@/lib/supabase/types";
import { CATEGORY_STYLES } from "@/lib/opportunities/styles";

const initialState: SubmitState = { status: "idle" };

export function SubmitForm() {
  const [state, formAction, pending] = useActionState(submitOpportunity, initialState);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("hackathon");

  if (state.status === "success") {
    return (
      <div className="px-2.5 py-15 text-center">
        <div className="mx-auto mb-4.5 flex h-14 w-14 items-center justify-center rounded-full bg-ok-bg text-2xl text-ok">
          ✓
        </div>
        <h1 className="mb-2 font-display text-2xl font-bold text-ink">Nice — it&apos;s in the queue</h1>
        <p className="mx-auto mb-6 max-w-[38ch] text-[15.5px] leading-relaxed text-ink-3">
          Thanks for keeping the radar sharp. We&apos;ll review it shortly and it&apos;ll appear for
          everyone once it&apos;s approved.
        </p>
        <a
          href="/submit"
          className="inline-block rounded-xl border border-border bg-surface px-5.5 py-3 text-[15px] font-semibold text-ink"
        >
          Submit another
        </a>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1.5 font-display text-[28px] font-bold tracking-[-0.02em] text-ink">
        Spotted something we missed?
      </h1>
      <p className="mb-6.5 text-[15.5px] leading-snug text-ink-3">
        Drop the essentials below. A human checks it before it goes live.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        {/* Honeypot: hidden from sighted users and unreachable by keyboard,
            so only automated fillers ever populate it. */}
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <label>
            Leave this field blank
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">What is it?</span>
          <input
            name="title"
            placeholder="e.g. Hack the Valley 2026"
            className="w-full rounded-[11px] border border-border bg-surface px-3.5 py-3 text-[15px] focus:border-focus"
          />
          {state.fieldErrors?.title && (
            <span className="mt-1 block text-xs text-danger-ink">{state.fieldErrors.title}</span>
          )}
        </label>

        <div className="flex flex-wrap gap-3">
          <label className="block min-w-[180px] flex-1">
            <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">
              Who&apos;s running it?
            </span>
            <input
              name="organization"
              placeholder="Organisation"
              className="w-full rounded-[11px] border border-border bg-surface px-3.5 py-3 text-[15px] focus:border-focus"
            />
            {state.fieldErrors?.organization && (
              <span className="mt-1 block text-xs text-danger-ink">
                {state.fieldErrors.organization}
              </span>
            )}
          </label>
          <label className="block min-w-[180px] flex-1">
            <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">
              Deadline <span className="font-normal text-ink-5">(leave blank if ongoing)</span>
            </span>
            <input
              type="date"
              name="deadline"
              className="w-full rounded-[11px] border border-border bg-surface px-3.5 py-3 text-[15px] focus:border-focus"
            />
            {state.fieldErrors?.deadline && (
              <span className="mt-1 block text-xs text-danger-ink">{state.fieldErrors.deadline}</span>
            )}
          </label>
        </div>

        <div>
          <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">Category</span>
          <input type="hidden" name="category" value={category} />
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => {
              const active = category === c;
              const style = CATEGORY_STYLES[c];
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={
                    active
                      ? `inline-flex items-center gap-1.5 rounded-full border border-transparent px-3.5 py-1.5 text-[13px] font-semibold ${style.bg} ${style.fg}`
                      : "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-[13px] font-semibold text-ink-3"
                  }
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                  {CATEGORY_LABELS[c]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">Who&apos;s it for?</span>
          <div className="flex flex-wrap gap-3">
            {AUDIENCE_TAGS.map((a) => (
              <label key={a} className="flex items-center gap-1.5 text-sm text-ink-2">
                <input type="checkbox" name="audience" value={a} defaultChecked={a === "students"} />
                {AUDIENCE_LABELS[a]}
              </label>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">Link to the source</span>
          <input
            name="url"
            placeholder="https://…"
            className="w-full rounded-[11px] border border-border bg-surface px-3.5 py-3 text-[15px] focus:border-focus"
          />
          {state.fieldErrors?.url && (
            <span className="mt-1 block text-xs text-danger-ink">{state.fieldErrors.url}</span>
          )}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">One-line description</span>
          <textarea
            name="description"
            placeholder="What should someone know in a sentence?"
            rows={3}
            className="w-full resize-y rounded-[11px] border border-border bg-surface px-3.5 py-3 text-[15px] leading-snug focus:border-focus"
          />
          {state.fieldErrors?.description && (
            <span className="mt-1 block text-xs text-danger-ink">{state.fieldErrors.description}</span>
          )}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">
            Your email <span className="font-normal text-ink-5">(optional, for follow-up only)</span>
          </span>
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            className="w-full rounded-[11px] border border-border bg-surface px-3.5 py-3 text-[15px] focus:border-focus"
          />
          {state.fieldErrors?.email && (
            <span className="mt-1 block text-xs text-danger-ink">{state.fieldErrors.email}</span>
          )}
        </label>

        {state.status === "error" && state.message && (
          <div className="rounded-xl bg-danger-bg px-3.5 py-2.5 text-sm text-danger-ink">
            {state.message}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 w-full rounded-[13px] bg-accent py-4 font-display text-base font-bold text-accent-ink hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send it to the queue"}
        </button>
      </form>
    </div>
  );
}
