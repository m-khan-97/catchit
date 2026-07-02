import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "A note from the people who built CatchIt, and why.",
};

const team = [
  {
    name: "Muhammad Ibrahim",
    role: "Founder — had the itch, built the first version",
    initials: "MI",
    color: "#C7F04A",
  },
  {
    name: "Vishnu Ajith",
    role: "Co-builder — engineering & data",
    initials: "VA",
    color: "#BFD8FF",
  },
  {
    name: "Muhammed Sihan Haroon",
    role: "Co-builder — product & outreach",
    initials: "SH",
    color: "#F7C9DE",
  },
];

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

      <div className="mt-9 border-t border-border pt-6.5">
        <div className="mb-3.5 text-[12.5px] tracking-[0.08em] text-ink-5 uppercase">Built by</div>
        <div className="flex flex-col gap-2.5">
          {team.map((p) => (
            <div key={p.name} className="flex items-center gap-3.5">
              <span
                className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-full font-display text-[15px] font-semibold text-[#20201B]"
                style={{ background: p.color }}
              >
                {p.initials}
              </span>
              <div>
                <div className="font-display text-[15.5px] font-semibold text-ink">{p.name}</div>
                <div className="text-[13px] text-ink-4">{p.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7.5 rounded-2xl border border-dashed border-border bg-surface px-4.5 py-4">
        <div className="mb-1.5 text-[12.5px] font-semibold text-ink-2">On the name</div>
        <p className="text-sm leading-snug text-ink-3">
          We landed on <strong className="text-ink">CatchIt</strong> — it says exactly what the
          thing does: catch the opportunity before it slips past. Earlier contenders were{" "}
          <strong className="text-ink">Beacon</strong>, <strong className="text-ink">Signal</strong>{" "}
          and <strong className="text-ink">Loop</strong>, but nothing else felt as plain-spoken.
        </p>
      </div>
    </section>
  );
}
