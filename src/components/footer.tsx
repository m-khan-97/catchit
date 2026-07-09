import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[820px] flex-wrap items-center justify-between gap-3 px-5 py-6 text-[13px] text-ink-4">
        <div className="flex flex-wrap items-center gap-4">
          <span>CatchIt</span>
          <Link href="/privacy" className="hover:text-ink-2">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-ink-2">
            Terms
          </Link>
        </div>
        <Link href="/stories" className="underline hover:text-ink-2">
          Caught something thanks to CatchIt? Tell your story.
        </Link>
      </div>
    </footer>
  );
}
