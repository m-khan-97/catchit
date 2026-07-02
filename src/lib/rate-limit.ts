import "server-only";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;

const hits = new Map<string, number[]>();

/**
 * In-memory best-effort limiter for the public submission route. This is
 * per-instance state, so on Vercel's serverless functions it only limits
 * requests that land on the same warm instance — good enough to blunt
 * casual spam, not a hard guarantee. A durable store (e.g. Upstash Redis)
 * would be needed for strict multi-instance enforcement.
 */
export function isRateLimited(key: string, now: number = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > MAX_PER_WINDOW;
}
