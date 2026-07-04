"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import {
  requestMagicLink,
  verifyLoginCode,
  type MagicLinkState,
  type VerifyCodeState,
} from "./actions";

const initialMagicLinkState: MagicLinkState = { status: "idle" };
const initialVerifyState: VerifyCodeState = { status: "idle" };

function CodeForm({ email, next }: { email: string; next: string }) {
  const [state, formAction, pending] = useActionState(verifyLoginCode, initialVerifyState);

  return (
    <div>
      <div className="mb-4 rounded-2xl border border-border bg-surface px-5 py-4 text-center">
        <div className="mb-1 font-display text-[15.5px] font-semibold text-ink">
          Check your inbox ✓
        </div>
        <p className="text-sm text-ink-3">
          We sent a code to <strong className="text-ink-2">{email}</strong>. Enter it below —
          faster than clicking the link, and works even if your email provider scans links
          before you open them.
        </p>
      </div>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">
            6-digit code
          </span>
          <input
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            placeholder="123456"
            className="w-full rounded-[11px] border border-border bg-surface px-3.5 py-3 text-center text-[20px] tracking-[0.3em] focus:border-focus"
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
          {pending ? "Verifying…" : "Verify & sign in"}
        </button>
      </form>
    </div>
  );
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/account";
  const [state, formAction, pending] = useActionState(requestMagicLink, initialMagicLinkState);

  if (state.status === "code_sent" && state.email) {
    return <CodeForm email={state.email} next={state.next ?? next} />;
  }

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
          placeholder="you@university.ac.uk"
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
        {pending ? "Sending…" : "Send sign-in code"}
      </button>
    </form>
  );
}
