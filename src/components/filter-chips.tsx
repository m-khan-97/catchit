import Link from "next/link";

export interface ChipOption {
  value: string;
  label: string;
  /** Optional dot color class (e.g. category color) shown before the label. */
  dotClass?: string;
}

interface FilterChipsProps {
  paramKey: string;
  options: ChipOption[];
  active: string;
  currentParams: URLSearchParams;
  activeDotClass?: string;
}

/**
 * Renders a row of filter chips as plain links with an updated query
 * string — filtering works with JS disabled and stays crawlable/shareable.
 */
export function FilterChips({
  paramKey,
  options,
  active,
  currentParams,
  activeDotClass,
}: FilterChipsProps) {
  return (
    <>
      {options.map((opt) => {
        const isActive = active === opt.value;
        const params = new URLSearchParams(currentParams);
        if (opt.value === "all") {
          params.delete(paramKey);
        } else {
          params.set(paramKey, opt.value);
        }
        const qs = params.toString();
        const href = qs ? `/?${qs}` : "/";

        return (
          <Link
            key={opt.value}
            href={href}
            className={
              isActive
                ? "inline-flex items-center gap-1.5 rounded-full border border-transparent bg-accent px-3.5 py-1.5 text-[13px] font-semibold text-accent-ink"
                : "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-[13px] font-semibold text-ink-3"
            }
          >
            {opt.dotClass && (
              <span
                className={`h-1.5 w-1.5 rounded-full ${isActive && activeDotClass ? activeDotClass : opt.dotClass}`}
              />
            )}
            {opt.label}
          </Link>
        );
      })}
    </>
  );
}
