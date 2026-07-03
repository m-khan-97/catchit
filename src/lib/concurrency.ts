import "server-only";

/**
 * Runs `fn` over `items` with at most `limit` in flight at once — for fanning
 * out many independent network calls (AI-search queries, link checks)
 * without either running them fully sequentially (slow) or fully unbounded
 * (risks rate limits / a huge burst of concurrent requests).
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await fn(items[current]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}
