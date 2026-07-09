"use client";

import { useActionState, useEffect } from "react";
import { submitStory, type SubmitStoryState } from "./actions";
import { trackEvent } from "@/lib/analytics";

const initialState: SubmitStoryState = { status: "idle" };

export function StoryForm() {
  const [state, formAction, pending] = useActionState(submitStory, initialState);

  useEffect(() => {
    if (state.status === "success") trackEvent("story_submit");
  }, [state.status]);

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-12 text-center">
        <div className="mx-auto mb-4.5 flex h-14 w-14 items-center justify-center rounded-full bg-ok-bg text-2xl text-ok">
          ✓
        </div>
        <h2 className="mb-2 font-display text-xl font-bold text-ink">Thanks for sharing that</h2>
        <p className="mx-auto mb-6 max-w-[38ch] text-[15px] leading-relaxed text-ink-3">
          A human reads every story before it goes up — yours will appear here once it&apos;s
          approved.
        </p>
        <a
          href="/stories"
          className="inline-block rounded-xl border border-border bg-bg px-5.5 py-3 text-[15px] font-semibold text-ink"
        >
          Share another
        </a>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5"
    >
      {/* Honeypot: hidden from sighted users and unreachable by keyboard,
          so only automated fillers ever populate it. */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>
          Leave this field blank
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="block min-w-[160px] flex-1">
          <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">Your name</span>
          <input
            name="name"
            placeholder="e.g. Amina Yusuf"
            className="w-full rounded-[11px] border border-border bg-bg px-3.5 py-3 text-[15px] focus:border-focus"
          />
          {state.fieldErrors?.name && (
            <span className="mt-1 block text-xs text-danger-ink">{state.fieldErrors.name}</span>
          )}
        </label>
        <label className="block min-w-[160px] flex-1">
          <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">
            Who you are <span className="font-normal text-ink-5">(optional)</span>
          </span>
          <input
            name="role_line"
            placeholder="e.g. CS student, Ulster University"
            className="w-full rounded-[11px] border border-border bg-bg px-3.5 py-3 text-[15px] focus:border-focus"
          />
          {state.fieldErrors?.role_line && (
            <span className="mt-1 block text-xs text-danger-ink">{state.fieldErrors.role_line}</span>
          )}
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">
          What did CatchIt help you catch?
        </span>
        <textarea
          name="story"
          placeholder="What happened, and how did it help?"
          rows={4}
          className="w-full resize-y rounded-[11px] border border-border bg-bg px-3.5 py-3 text-[15px] leading-snug focus:border-focus"
        />
        {state.fieldErrors?.story && (
          <span className="mt-1 block text-xs text-danger-ink">{state.fieldErrors.story}</span>
        )}
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">
          Link to what you caught <span className="font-normal text-ink-5">(optional)</span>
        </span>
        <input
          name="opportunity_url"
          placeholder="https://…"
          className="w-full rounded-[11px] border border-border bg-bg px-3.5 py-3 text-[15px] focus:border-focus"
        />
        {state.fieldErrors?.opportunity_url && (
          <span className="mt-1 block text-xs text-danger-ink">
            {state.fieldErrors.opportunity_url}
          </span>
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
        {pending ? "Sending…" : "Share your story"}
      </button>
    </form>
  );
}
