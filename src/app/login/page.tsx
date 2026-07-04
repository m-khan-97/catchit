import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-[380px] pt-10">
      <h1 className="mb-1.5 font-display text-2xl font-bold tracking-[-0.02em] text-ink">
        Sign in
      </h1>
      <p className="mb-6 text-[15px] text-ink-3">
        Save opportunities, follow filters, and get a personal calendar feed. No password —
        just a code sent to your email.
      </p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </section>
  );
}
