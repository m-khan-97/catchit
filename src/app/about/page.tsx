import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "A note from the people who built CatchIt, and why.",
};

export default function AboutPage() {
  return (
    <section className="max-w-[600px]">
      <div className="mb-3.5 text-[12.5px] tracking-[0.08em] text-ink-5 uppercase">
        A note from the people who built this
      </div>
      <h1 className="mb-5.5 font-display text-[29px] leading-[1.16] font-bold tracking-[-0.02em] text-ink">
        Nobody should miss out just because the opportunity never reached them.
      </h1>
      <div className="flex flex-col gap-4 text-base leading-relaxed text-ink-2">
        <p>
          Every year the same thing happens. A hackathon opens registration, a company hands out
          free cloud credits, a conference calls for student speakers — and thousands of people
          who&apos;d have jumped at it never hear a word. Not because they weren&apos;t good
          enough. Because it simply never landed in front of them.
        </p>
        <p>
          It&apos;s not just students. Researchers miss conference and journal deadlines, and
          early-career professionals miss the free tools and events too — for the exact same
          reason. The information exists; it&apos;s just scattered across a hundred inboxes,
          group chats and pages nobody checks in time.
        </p>
        <p>
          That&apos;s the whole reason CatchIt exists. One place that quietly gathers what&apos;s
          out there and puts it where you&apos;ll actually see it, while there&apos;s still time to
          act. No more finding out about the perfect thing the day after it closed.
        </p>
      </div>
    </section>
  );
}
