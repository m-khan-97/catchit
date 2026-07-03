import "server-only";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export interface SendResult {
  ok: boolean;
  error?: string;
}

/**
 * Sends one email via Resend's REST API (no SDK needed for a single
 * endpoint). Returns a result instead of throwing — a failed send to one
 * subscriber shouldn't abort a digest run for everyone else. No-ops with
 * a clear error when RESEND_API_KEY isn't configured, so the app runs
 * fine locally before the account exists.
 */
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.DIGEST_FROM_EMAIL;
  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      // Dev fallback: log instead of sending, so the whole signup →
      // confirm → digest flow is testable before a Resend account exists.
      // The confirm/unsubscribe URLs appear in the dev server log.
      console.log(`[email dev-mode] to=${to} subject="${subject}"\n${html}`);
      return { ok: true };
    }
    return { ok: false, error: "RESEND_API_KEY / DIGEST_FROM_EMAIL not configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
