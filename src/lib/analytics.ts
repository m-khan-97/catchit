declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, unknown>) => void };
  }
}

/**
 * Fires a Umami custom event from a client component. No-ops if Umami
 * isn't loaded (no NEXT_PUBLIC_UMAMI_WEBSITE_ID configured, ad blocker,
 * etc.) — analytics failing should never affect the feature it's attached to.
 * Click-based events (apply_click, ics_subscribe) don't need this helper;
 * they use Umami's `data-umami-event` HTML attributes directly instead.
 */
export function trackEvent(event: string, data?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.umami?.track(event, data);
}
