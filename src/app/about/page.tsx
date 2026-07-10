import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CatchAnimation } from "@/components/catch-animation";

export const metadata: Metadata = {
  title: "About",
  description: "A note from the people who built CatchIt, and why.",
};

const STEPS = [
  {
    emoji: "📵",
    bg: "bg-danger-bg",
    title: "It exists. You just never see it.",
    body: "Free credits, hackathons, CFPs — all real, all scattered across inboxes, group chats and pages nobody checks in time.",
  },
  {
    emoji: "😤",
    bg: "bg-cat-event-bg",
    title: "Not just students, either.",
    body: "Early-career people miss the same bursaries and events — not from lack of talent, just bad timing.",
  },
  {
    emoji: "📡",
    bg: "bg-cat-voucher-bg",
    title: "So we built a radar for it.",
    body: "One feed, sorted by urgency, so the good stuff finds you before the deadline does.",
  },
];

const TEAM = [
  {
    name: "Muhammad Ibrahim",
    photo: "/team/ibrahim.png",
    tag: "Missed a deadline once. Never again.",
    emoji: "🛠️",
  },
  {
    name: "Vishnu Ajith",
    photo: "/team/vishnu-ajith.jpeg",
    tag: "Has 47 tabs open. All of them are opportunities.",
    emoji: "⚙️",
  },
  {
    name: "Muhammad Sihan Haroon",
    photo: "/team/sihan-haroon.jpeg",
    tag: "Replies to emails at 2am. Somehow always on time.",
    emoji: "📣",
  },
];

export default function AboutPage() {
  return (
    <section className="max-w-[600px]">
      <div className="mb-3.5 text-[12.5px] tracking-[0.08em] text-ink-5 uppercase">
        A note from the people who built this
      </div>
      <h1 className="mb-5.5 font-display text-[29px] leading-[1.16] font-bold tracking-[-0.02em] text-ink">
        Nobody should miss out just because{" "}
        <span className="bg-[linear-gradient(180deg,transparent_80%,var(--color-accent)_80%)] px-px">
          it never reached them.
        </span>
      </h1>
      <div className="mt-1">
        <CatchAnimation />
      </div>

      <div className="mb-7 flex flex-col gap-2.5">
        {STEPS.map((step) => (
          <div
            key={step.title}
            className="flex items-start gap-3.5 rounded-2xl border border-border bg-surface p-4"
          >
            <span
              className={`flex size-[42px] flex-shrink-0 items-center justify-center rounded-xl text-xl ${step.bg}`}
            >
              {step.emoji}
            </span>
            <div>
              <div className="mb-0.5 font-display text-base font-semibold text-ink">
                {step.title}
              </div>
              <div className="text-sm leading-snug text-ink-3">{step.body}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-7.5 rounded-2xl bg-panel p-6">
        <div className="font-display text-[22px] leading-[1.28] font-bold tracking-[-0.015em] text-[#EDECE2]">
          One place that catches it <span className="text-accent">before it&apos;s gone</span> —
          so you stop finding out a day too late.
        </div>
      </div>

      <div className="mb-3.5 text-[12.5px] tracking-[0.08em] text-ink-5 uppercase">
        At your service
      </div>
      <div className="flex flex-col gap-2.5">
        {TEAM.map((person) => (
          <div
            key={person.name}
            className="flex items-center gap-3.5 rounded-2xl border border-border bg-surface px-4 py-3.5"
          >
            <Image
              src={person.photo}
              alt={person.name}
              width={50}
              height={50}
              className="size-[50px] flex-shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="font-display text-[15px] font-semibold text-ink">{person.name}</div>
              <div className="mt-px text-[13px] text-ink-4">{person.tag}</div>
            </div>
            <span className="flex-shrink-0 text-xl">{person.emoji}</span>
          </div>
        ))}
      </div>

      <div className="mt-7 text-[14.5px] text-ink-3">
        Did CatchIt catch something for you?{" "}
        <Link href="/stories" className="font-semibold text-ink underline hover:text-ink-2">
          Tell your story →
        </Link>
      </div>
    </section>
  );
}
