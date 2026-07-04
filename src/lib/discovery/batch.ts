import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { buildSearchParams, extractSearchResult, type SearchResult } from "./ai-search";

const anthropic = new Anthropic();

export interface BatchTask {
  category: string;
  query: string;
}

/** Submits every AI-search query as one Message Batch — 50% off the synchronous
 * price, since a daily discovery run isn't latency-sensitive enough to need
 * results in seconds. Batches usually finish within an hour (max 24h); a
 * separate collect cron picks up the results later. */
export async function submitSearchBatch(
  tasks: BatchTask[]
): Promise<{ batchId: string; taskMap: Record<string, BatchTask> }> {
  const taskMap: Record<string, BatchTask> = {};
  const requests = tasks.map((task, i) => {
    const customId = `t${i}`;
    taskMap[customId] = task;
    return { custom_id: customId, params: buildSearchParams(task.query) };
  });

  const batch = await anthropic.messages.batches.create({ requests });
  return { batchId: batch.id, taskMap };
}

export interface BatchResultEntry {
  category: string;
  query: string;
  result: SearchResult;
}

/** Checks a submitted batch; returns `ended: false` if still processing. */
export async function pollSearchBatch(
  batchId: string,
  taskMap: Record<string, BatchTask>
): Promise<{ ended: boolean; results: BatchResultEntry[] }> {
  const batch = await anthropic.messages.batches.retrieve(batchId);
  if (batch.processing_status !== "ended") {
    return { ended: false, results: [] };
  }

  const results: BatchResultEntry[] = [];
  const resultStream = await anthropic.messages.batches.results(batchId);
  for await (const item of resultStream) {
    const task = taskMap[item.custom_id];
    if (!task) continue; // unknown custom_id shouldn't happen; skip rather than crash the whole collection

    const result: SearchResult =
      item.result.type === "succeeded"
        ? extractSearchResult(item.result.message)
        : { candidates: [], discarded: 0, error: `batch result: ${item.result.type}` };

    results.push({ category: task.category, query: task.query, result });
  }

  return { ended: true, results };
}
