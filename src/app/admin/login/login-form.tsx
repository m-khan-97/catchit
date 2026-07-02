"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { status: "idle" };

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin";
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-[11px] border border-border bg-surface px-3.5 py-3 text-[15px] focus:border-focus"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">Password</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-[11px] border border-border bg-surface px-3.5 py-3 text-[15px] focus:border-focus"
        />
      </label>
      {state.status === "error" && state.message && (
        <div className="rounded-xl bg-danger-bg px-3.5 py-2.5 text-sm text-danger-ink">
          {state.message}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 w-full rounded-[13px] bg-accent py-3.5 font-display text-base font-bold text-accent-ink hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
