"use client";

import { useEffect, useState } from "react";

// Non-standard Chromium event — not in TypeScript's DOM lib.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Older iOS Safari exposes this instead of the display-mode media query.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Chrome/Edge/Android only — iOS Safari never fires beforeinstallprompt,
 * so this component simply never renders there (users install via the
 * Share sheet instead, which apple-icon.tsx + appleWebApp metadata cover). */
export function InstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setDeferredEvent(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!deferredEvent || dismissed) return null;

  async function install() {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    await deferredEvent.userChoice;
    setDeferredEvent(null);
  }

  return (
    <div className="mb-7 flex items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 font-display text-[15px] font-semibold text-ink">
          Install CatchIt
        </div>
        <p className="text-[13.5px] text-ink-3">
          Add it to your home screen for one-tap access and push reminders.
        </p>
      </div>
      <button
        onClick={install}
        className="flex-shrink-0 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-accent-ink hover:bg-accent-hover"
      >
        Install
      </button>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="flex-shrink-0 text-ink-5 hover:text-ink-3"
      >
        ✕
      </button>
    </div>
  );
}
