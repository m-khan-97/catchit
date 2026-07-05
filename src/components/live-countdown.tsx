"use client";

import { useEffect, useState } from "react";

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  closed: boolean;
}

function computeParts(deadline: string): CountdownParts {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, closed: true };
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    closed: false,
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Live-ticking countdown for the opportunity detail page. Starts blank
 * server-side (deadline math depends on the client's exact "now", so
 * filling it in after mount avoids a hydration mismatch) and updates
 * every second once mounted. */
export function LiveCountdown({ deadline }: { deadline: string | null }) {
  const [parts, setParts] = useState<CountdownParts | null>(null);

  useEffect(() => {
    if (!deadline) return;
    const tick = () => setParts(computeParts(deadline));
    // rAF (not a direct call) for the first tick so the initial fill-in
    // and every subsequent second use the same "setState from a callback"
    // shape, rather than one sync call plus a timer.
    const raf = requestAnimationFrame(tick);
    const interval = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(interval);
    };
  }, [deadline]);

  if (!deadline || !parts) return null;

  if (parts.closed) {
    return <div className="mt-1.5 font-display text-[13.5px] font-semibold text-danger-ink">Closed</div>;
  }

  // Under 48h: dramatic ticking HH:MM:SS. Otherwise days+hours — second-level
  // precision on a two-week-out deadline is just noise, not urgency.
  if (parts.days === 0 && parts.hours < 48) {
    return (
      <div className="mt-1.5 font-display text-base font-bold tabular-nums text-accent">
        {pad(parts.hours)}:{pad(parts.minutes)}:{pad(parts.seconds)}
        <span className="ml-1.5 text-[11px] font-semibold text-ink-4">left</span>
      </div>
    );
  }

  return (
    <div className="mt-1.5 font-display text-[13.5px] font-semibold text-ink-3 tabular-nums">
      {parts.days}d {parts.hours}h {parts.minutes}m
      <span className="ml-1.5 text-[11px] font-semibold text-ink-4">left</span>
    </div>
  );
}
