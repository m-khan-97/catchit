import * as Sentry from "@sentry/nextjs";

// Inert until SENTRY_DSN is set — no account exists yet. Sentry's capture
// calls no-op safely when the client was never initialized, so exporting
// onRequestError unconditionally below is safe either way.
export function register() {
  if (!process.env.SENTRY_DSN) return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
  });
}

export const onRequestError = Sentry.captureRequestError;
