export function formatDeadlineFull(deadline: string | null): string {
  if (!deadline) return "Ongoing — no deadline";
  const d = new Date(deadline);
  const formatted = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
  return d.getTime() <= Date.now() ? `Closed ${formatted}` : `Closes ${formatted}`;
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return "the source";
  }
}
