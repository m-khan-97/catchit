import * as Sentry from "@sentry/nextjs";

// Same inert-until-configured pattern as src/instrumentation.ts.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
  });
}
