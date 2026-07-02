import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin sign in" };

export default function AdminLoginPage() {
  return (
    <section className="mx-auto max-w-[380px] pt-10">
      <h1 className="mb-1.5 font-display text-2xl font-bold tracking-[-0.02em] text-ink">
        Admin sign in
      </h1>
      <p className="mb-6 text-[15px] text-ink-3">For the CatchIt review team only.</p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </section>
  );
}
