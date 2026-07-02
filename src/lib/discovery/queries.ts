import "server-only";

function currentYear(): number {
  return new Date().getFullYear();
}

function currentMonthYear(): string {
  const d = new Date();
  return `${d.toLocaleString("en-US", { month: "long" })} ${d.getFullYear()}`;
}

export const QUERY_POOLS: Record<string, string[]> = {
  voucher: [
    `new free student software credits ${currentMonthYear()}`,
    "GitHub Student Developer Pack new partner offers",
    "AWS Educate OR Azure for Students new credits",
    "free cloud credits for students new announcement",
    "JetBrains OR Notion OR Figma student discount new offer",
    "free API credits for students startups program",
  ],
  event: [
    `student tech conference free tickets ${currentMonthYear()}`,
    "student volunteer conference registration tech",
    "hackathon adjacent tech meetup students free",
    `tech events for students ${currentMonthYear()} UK OR remote`,
  ],
  scholarship: [
    `undergraduate scholarship computer science UK deadline ${currentYear()}`,
    `postgraduate scholarship AI OR machine learning deadline ${currentYear()}`,
    "women in tech scholarship bursary UK deadline",
    `international student scholarship STEM deadline ${currentYear()}`,
  ],
  internship: [
    `summer ${currentYear()} software engineering internship UK applications open`,
    `research internship computer science ${currentYear()} deadline`,
    "tech internship applications open students remote",
    `graduate internship program ${currentYear()} deadline tech`,
  ],
  conference: [
    `international conference machine learning ${currentYear()} call for papers deadline`,
    `IEEE OR ACM conference ${currentYear()} paper submission deadline`,
    `student hackathon UK OR remote ${currentMonthYear()}`,
    "call for papers tech conference deadline student speakers",
  ],
  journal: [
    `journal special issue call for papers computer science ${currentMonthYear()}`,
    `Springer OR Elsevier OR MDPI special issue deadline ${currentYear()}`,
    `PhD funding OR research fellowship computer science deadline ${currentYear()}`,
  ],
};

/** Deterministic daily rotation so queries vary day-to-day with no external state to track. */
export function pickQueriesForToday(pool: string[], count: number): string[] {
  if (pool.length <= count) return pool;
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
  );
  const start = dayOfYear % pool.length;
  const picked: string[] = [];
  for (let i = 0; i < count; i++) {
    picked.push(pool[(start + i) % pool.length]);
  }
  return picked;
}
