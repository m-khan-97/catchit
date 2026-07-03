"use client";

import { useActionState } from "react";
import { subscribeToDigest, type DigestSignupState } from "@/app/digest/actions";

const initialState: DigestSignupState = { status: "idle" };

export function DigestSignup() {
  const [state, formAction, pending] = useActionState(subscribeToDigest, initialState);

  if (state.status === "success") {
    return (
      <div className="mt-10 rounded-2xl border border-border bg-surface px-5 py-5 text-center">
        <div className="mb-1 font-display text-[15.5px] font-semibold text-ink">
          Check your inbox ✓
        </div>
        <p className="text-sm text-ink-3">
          We&apos;ve sent a confirmation link — one click and the weekly radar comes to you.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-2xl border border-border bg-surface px-5 py-5">
      <div className="mb-1 font-display text-[15.5px] font-semibold text-ink">
        Get the weekly radar in your inbox
      </div>
      <p className="mb-4 text-sm text-ink-3">
        New opportunities and closing deadlines, once a week. No spam, unsubscribe in one click.
      </p>
      <form action={formAction} className="flex flex-wrap gap-2">
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <label>
            Leave this field blank
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <input
          type="email"
          name="email"
          required
          placeholder="you@university.ac.uk"
          className="min-w-[220px] flex-1 rounded-xl border border-border bg-bg px-3.5 py-2.5 text-[14.5px] focus:border-focus"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-accent px-5 py-2.5 font-display text-[14.5px] font-bold text-accent-ink hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Subscribing…" : "Subscribe"}
        </button>
      </form>
      {state.status === "error" && state.message && (
        <p className="mt-2 text-[13px] text-danger-ink">{state.message}</p>
      )}
    </div>
  );
}
