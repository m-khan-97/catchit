export function Logo({ size = 26 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex items-center justify-center rounded-full bg-logo-bg"
      style={{ width: size, height: size }}
    >
      <span
        className="relative block rounded-full border-[1.5px] border-accent"
        style={{ width: size * 0.54, height: size * 0.54 }}
      />
      <span
        className="animate-opp-sweep absolute top-1/2 left-1/2 h-[1.5px] bg-accent"
        style={{ width: size * 0.42, transformOrigin: "left center" }}
      />
    </span>
  );
}
