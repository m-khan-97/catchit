import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapWithConcurrency } from "@/lib/concurrency";

const CHECK_CONCURRENCY = 10;
const TIMEOUT_MS = 10_000;
const USER_AGENT = "Mozilla/5.0 (compatible; CatchItLinkChecker/1.0)";

async function tryFetch(url: string, method: "HEAD" | "GET"): Promise<"ok" | "broken"> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method,
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    return res.ok ? "ok" : "broken";
  } catch {
    return "broken";
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * HEAD first (cheap — no response body), and only if that fails for any
 * reason (some sites 403/405/hang on HEAD despite being perfectly live to
 * a normal GET) fall back to a full GET before calling it broken.
 */
async function checkUrl(url: string): Promise<"ok" | "broken"> {
  const headResult = await tryFetch(url, "HEAD");
  if (headResult === "ok") return "ok";
  return tryFetch(url, "GET");
}

export interface LinkCheckSummary {
  checked: number;
  ok: number;
  broken: number;
}

/**
 * Pings every approved opportunity's URL and updates link_status +
 * last_checked_at. Never touches the public site directly — broken links
 * only surface in the admin panel, so students never see a known-dead
 * link on the feed.
 */
export async function runLinkCheck(): Promise<LinkCheckSummary> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("opportunities")
    .select("id, url")
    .eq("status", "approved");
  if (error) throw error;

  const rows = data ?? [];
  const results = await mapWithConcurrency(rows, CHECK_CONCURRENCY, async (row) => ({
    id: row.id,
    status: await checkUrl(row.url),
  }));

  let ok = 0;
  let broken = 0;
  const now = new Date().toISOString();

  for (const result of results) {
    const { error: updateError } = await supabase
      .from("opportunities")
      .update({ link_status: result.status, last_checked_at: now })
      .eq("id", result.id);
    if (!updateError) {
      if (result.status === "ok") ok++;
      else broken++;
    }
  }

  return { checked: rows.length, ok, broken };
}
