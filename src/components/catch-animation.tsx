"use client";

import { useEffect, useState } from "react";

const CHIPS = [
  { emoji: "🎯", label: "Hackathon", bg: "bg-cat-hackathon-bg", fg: "text-cat-hackathon-fg", delay: "0s" },
  { emoji: "💸", label: "Free credits", bg: "bg-cat-voucher-bg", fg: "text-cat-voucher-fg", delay: "2s" },
  { emoji: "🎤", label: "CFP", bg: "bg-cat-event-bg", fg: "text-cat-event-fg", delay: "4s" },
];

/**
 * Decorative, aria-hidden loop for the About page: three opportunity chips
 * fall one at a time on a 6s cycle (2s stagger) into a mitt, which does a
 * squash-and-stretch catch each time. The counter is purely cosmetic —
 * ticks in sync with catches, no real data behind it.
 */
export function CatchAnimation() {
  const [caught, setCaught] = useState(0);

  useEffect(() => {
    const startDelay = setTimeout(() => {
      setCaught((c) => c + 1);
      const interval = setInterval(() => setCaught((c) => c + 1), 2000);
      return () => clearInterval(interval);
    }, 1350);
    return () => clearTimeout(startDelay);
  }, []);

  return (
    <>
      <div
        aria-hidden="true"
        className="relative mb-2.5 h-[164px] overflow-hidden rounded-[18px] border border-border bg-surface"
      >
        <span className="absolute top-3 right-3.5 inline-flex items-center gap-1.5 rounded-full bg-pill-bg px-2.5 py-1 text-xs font-bold text-accent">
          🧺 {caught} caught
        </span>

        {CHIPS.map((chip) => (
          <span
            key={chip.label}
            className={`animate-cr-fall absolute top-[-18%] left-1/2 -translate-x-1/2 rounded-full px-3 py-1.5 text-[12.5px] font-bold whitespace-nowrap shadow-[0_4px_12px_rgba(0,0,0,0.18)] ${chip.bg} ${chip.fg}`}
            style={{ animationDelay: chip.delay }}
          >
            {chip.emoji} {chip.label}
          </span>
        ))}

        <span className="animate-cr-ring absolute bottom-6 left-1/2 h-14 w-14 -translate-x-1/2 rounded-full border-[2.5px] border-accent" />
        <span className="animate-cr-plus-one absolute bottom-[52px] left-1/2 text-[13.5px] font-extrabold whitespace-nowrap text-accent">
          +1 caught
        </span>
        <span
          className="animate-cr-mitt absolute bottom-3.5 left-1/2 inline-block -translate-x-1/2 text-[34px]"
          style={{ transformOrigin: "bottom center" }}
        >
          🧤
        </span>
        <div className="absolute bottom-2 left-1/2 h-2.5 w-[72px] -translate-x-1/2 rounded-full border-2 border-dashed border-border-soft" />
      </div>
      <div className="mb-7 text-center text-[12.5px] text-ink-5">
        opportunities, caught before they hit the floor (metaphorically — this bit&apos;s just for fun)
      </div>
    </>
  );
}
