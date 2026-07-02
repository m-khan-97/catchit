import { getFeed } from "@/lib/supabase/queries";
import { CATEGORIES, CATEGORY_LABELS, AUDIENCE_TAGS, AUDIENCE_LABELS } from "@/lib/supabase/types";
import { CATEGORY_STYLES } from "@/lib/opportunities/styles";
import { FilterChips, type ChipOption } from "@/components/filter-chips";
import { OpportunityCard } from "@/components/opportunity-card";

const REGIONS = ["UK", "Remote", "Global"];

type SearchParams = { [key: string]: string | string[] | undefined };

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const category = first(sp.category) || "all";
  const region = first(sp.region) || "all";
  const audience = first(sp.audience) || "all";
  const q = first(sp.q);

  const feed = await getFeed({ category, region, audience, q });

  const currentParams = new URLSearchParams();
  if (category !== "all") currentParams.set("category", category);
  if (region !== "all") currentParams.set("region", region);
  if (audience !== "all") currentParams.set("audience", audience);
  if (q) currentParams.set("q", q);

  const categoryOptions: ChipOption[] = [
    { value: "all", label: "All" },
    ...CATEGORIES.map((c) => ({
      value: c,
      label: CATEGORY_LABELS[c],
      dotClass: CATEGORY_STYLES[c].dot,
    })),
  ];
  const regionOptions: ChipOption[] = [
    { value: "all", label: "All" },
    ...REGIONS.map((r) => ({ value: r, label: r })),
  ];
  const audienceOptions: ChipOption[] = [
    { value: "all", label: "All" },
    ...AUDIENCE_TAGS.map((a) => ({ value: a, label: AUDIENCE_LABELS[a] })),
  ];

  // preserve active filters (minus q) when the search box round-trips via GET
  const searchHiddenParams = new URLSearchParams(currentParams);
  searchHiddenParams.delete("q");

  return (
    <section>
      <div className="mt-1 mb-6">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-pill-bg px-3.5 py-1.5 text-[12.5px] font-semibold text-accent">
          <span className="animate-opp-pulse h-1.5 w-1.5 rounded-full bg-accent" />
          {feed.length} live right now
        </div>
        <h1 className="mb-[11px] font-display text-[41px] leading-[1.01] font-bold tracking-[-0.038em] text-ink">
          Catch it{" "}
          <span className="bg-[linear-gradient(180deg,transparent_80%,var(--color-accent)_80%)] px-px">
            before it&apos;s gone.
          </span>
        </h1>
        <p className="max-w-[47ch] text-base leading-relaxed text-ink-3">
          Hackathons, free credits, scholarships, and conference &amp; journal CFPs — surfaced
          while there&apos;s still time to act, so you never find out a day too late.
        </p>
      </div>

      <form action="/" method="GET" className="relative mb-3.5">
        {[...searchHiddenParams.entries()].map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
        <span className="pointer-events-none absolute top-1/2 left-[15px] -translate-y-1/2 text-[15px] text-ink-5">
          ⌕
        </span>
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search titles, orgs, keywords…"
          className="w-full rounded-2xl border border-border bg-surface py-[13px] pr-4 pl-[38px] text-[15px] focus:border-focus focus:shadow-[0_0_0_3px_rgba(199,240,74,0.35)]"
        />
      </form>

      <div className="mb-2.5 flex flex-wrap gap-1.5">
        <FilterChips
          paramKey="category"
          options={categoryOptions}
          active={category}
          currentParams={currentParams}
        />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-1.5">
        <span className="mr-0.5 text-[12.5px] font-medium text-ink-4">Region</span>
        <FilterChips
          paramKey="region"
          options={regionOptions}
          active={region}
          currentParams={currentParams}
        />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-1.5">
        <span className="mr-0.5 text-[12.5px] font-medium text-ink-4">Audience</span>
        <FilterChips
          paramKey="audience"
          options={audienceOptions}
          active={audience}
          currentParams={currentParams}
        />
      </div>

      {feed.length > 0 ? (
        <div className="flex flex-col gap-3">
          {feed.map((o) => (
            <OpportunityCard key={o.id} opportunity={o} />
          ))}
        </div>
      ) : (
        <div className="py-15 text-center text-ink-4">
          <div className="mb-2 text-[34px]">◌</div>
          <div className="mb-1 font-display text-[17px] text-ink-2">Nothing on the radar here</div>
          <div className="text-sm">Try a different category or clear your search.</div>
        </div>
      )}
    </section>
  );
}
