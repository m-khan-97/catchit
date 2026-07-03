export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[820px] flex-wrap items-center justify-between gap-3 px-5 py-6 text-[13px] text-ink-4">
        <span>CatchIt</span>
        <a
          href="mailto:ibrahim.logix@gmail.com?subject=Caught%20something%20thanks%20to%20CatchIt!"
          className="underline hover:text-ink-2"
        >
          Caught something thanks to CatchIt? Tell us.
        </a>
      </div>
    </footer>
  );
}
