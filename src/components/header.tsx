"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

// Admin is deliberately not in this list — students should never see a
// hint of the review queue in the public nav.
const NAV = [
  { href: "/", label: "Feed" },
  { href: "/submit", label: "Submit" },
  { href: "/stats", label: "Stats" },
  { href: "/about", label: "About" },
];

export function Header({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-header-bg backdrop-blur-md">
      <div className="mx-auto flex max-w-[820px] items-center gap-3.5 px-5 py-3.5">
        <Link href="/" className="flex select-none items-center gap-2.5">
          <Logo />
          <span className="font-display text-[19px] font-bold tracking-[-0.02em] text-ink">
            CatchIt
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-0.5">
          {NAV.map((n) => {
            const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={
                  active
                    ? "rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink"
                    : "rounded-lg px-3 py-1.5 text-sm font-semibold text-ink-4 hover:text-ink-2"
                }
              >
                {n.label}
              </Link>
            );
          })}
          <Link
            href={signedIn ? "/account" : "/login"}
            className={
              pathname.startsWith("/account") || pathname === "/login"
                ? "rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink"
                : "rounded-lg px-3 py-1.5 text-sm font-semibold text-ink-4 hover:text-ink-2"
            }
          >
            {signedIn ? "Account" : "Sign in"}
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
