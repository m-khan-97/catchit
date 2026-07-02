# CatchIt — Build Plan for Claude Code

Paste a milestone at a time into Claude Code. Build incrementally and check in
after each milestone rather than attempting everything in one pass.

---

## Project Goal

Build **CatchIt** — a website that automatically discovers and publishes
career-relevant opportunities for students, researchers, and early-career
professionals: hackathons, scholarships, internships, free software/cloud
credits & vouchers, tech events, international conference CFPs, and journal
calls for papers — so people stop missing deadlines they'd otherwise never
hear about.

Tagline: **"Catch it before it's gone."** The product metaphor is a *radar*:
it quietly sweeps for opportunities and surfaces them while there's still
time to act.

This is a real tool for real people (rooted in UK higher education, multiple
institutions, but not limited to students), not a demo. Prioritize
correctness of dates/links and a clean, fast, mobile-first browsing
experience over visual flourish.

## Tech Stack (fixed — do not substitute)

- Next.js 14+ (App Router), TypeScript, Tailwind CSS
- Supabase: Postgres database + Auth (small named admin team, email/password)
- Hosting: Vercel
- Scheduling: Vercel Cron (defined in `vercel.json`) hitting internal API
  routes — no external cron service
- Discovery engine: Anthropic API (`@anthropic-ai/sdk`) with the `web_search`
  tool, called only from server-side routes, never the client
- Discord: simple incoming webhook (no bot framework)

## Design System (from the approved CatchIt mockup — follow it)

**Fonts**: Space Grotesk (headings, weights 600/700, tight letter-spacing
~-0.02em) + Instrument Sans (body). Load via `next/font/google`.

**Theme**: dark is the default; light theme available via a toggle in the
header (persist choice in `localStorage`, respect it on load without a
flash). Implement as CSS variables on `:root` (dark) with a
`[data-theme="light"]` override — wire these into Tailwind as semantic
color names:

```css
:root { /* dark (default) */
  --bg:#0F100C; --surface:#1B1C15; --surface-2:#26271E;
  --ink:#EDECE2; --ink-2:#C6C4B4; --ink-3:#9C9A8A; --ink-4:#807E6D; --ink-5:#6A6858;
  --border:#2C2D23; --border-soft:#252620;
  --header-bg:rgba(15,16,12,0.82);
  --pill-bg:#26271E; --panel:#1E1F17; --focus:#C7F04A;
  --ok:#79D3A0; --ok-bg:rgba(47,158,95,0.16);
}
[data-theme="light"] {
  --bg:#ECEBE4; --surface:#FFFFFF; --surface-2:#F2F0E8;
  --ink:#14140E; --ink-2:#57543F; --ink-3:#6B6A5D; --ink-4:#918E7F; --ink-5:#A9A697;
  --border:#E7E3D6; --border-soft:#EAE6D9;
  --header-bg:rgba(236,235,228,0.82);
  --pill-bg:#14140E; --panel:#20201B; --focus:#14140E;
  --ok:#1F7A48; --ok-bg:#E4F3EA;
}
```

**Accent**: lime `#C7F04A` — used for the logo, primary CTA buttons
(`background:#C7F04A; color:#14140E`, hover `#B6E23A`), active nav/filter
pills, and the "live right now" pulse dot. It stays lime in both themes.

**Logo**: a small radar — a circle outline with a rotating sweep line in
lime, next to the wordmark "CatchIt" in Space Grotesk 700. (Recreate as an
inline SVG/CSS animation: sweep rotates 360° over ~3.2s, linear, infinite.)

**Category badge colors** (pill with a 6px dot; light-bg/fg for light theme,
translucent bg + brighter fg for dark):

| category | dot | light bg/fg | dark bg/fg |
|---|---|---|---|
| hackathon | `#7C5CFF` | `#EEE9FF` / `#5B3FC4` | `rgba(124,92,255,.16)` / `#B7A6FF` |
| voucher | `#2F9E5F` | `#E2F3E9` / `#1F7A48` | `rgba(47,158,95,.16)` / `#79D3A0` |
| event | `#E08A2B` | `#FBEBD9` / `#A85D0C` | `rgba(224,138,43,.17)` / `#F0B36B` |
| scholarship | `#3B82D6` | `#E3EDFB` / `#1E5AAB` | `rgba(59,130,214,.17)` / `#82B4F0` |
| internship | `#D45C8E` | `#FBE4EE` / `#A83566` | `rgba(212,92,142,.17)` / `#EE9BC0` |
| conference | `#16A8A0` | `#DDF2F0` / `#0E6B65` | `rgba(22,168,160,.17)` / `#71D6CE` |
| journal | `#C9A227` | `#F7F0D8` / `#8A6D0B` | `rgba(201,162,39,.18)` / `#E3C86A` |
| other | `#8A8A7E` | `#EAEAE3` / `#55554C` | `rgba(138,138,126,.20)` / `#B8B7A9` |

(The conference/journal colors are new — they weren't in the mockup — so
tweak them freely if they clash; the rule is each category keeps a distinct
hue in both themes. Filter chip rows wrap on mobile, so eight categories is
fine.)

**Layout**: single centered column, max-width ~820px, sticky blurred header,
generous card radius (14–18px), cards lift slightly on hover. Mobile-first —
most visitors arrive from a phone via a shared link.

**Urgency chips** on every card/detail, computed from `deadline` at render:
- **soon** (< 72h left): red-tinted pill, pulsing dot, text like "46h left"
  (< 48h) or "3 days left"
- **later**: neutral outline pill, "12 days left" / "6 weeks left" (≥ 14 days)
- **ongoing** (no deadline): green-tinted pill, "Ongoing"
- **closed** (deadline passed): grey/struck state — see feed rules below

## Data Model

Single `opportunities` table in Supabase:

| column | type | notes |
|---|---|---|
| id | uuid, pk | |
| title | text | |
| organization | text | who's running it |
| category | enum | `hackathon`, `voucher`, `event`, `scholarship`, `internship`, `conference`, `journal`, `other` — `event` = non-academic tech events/meetups/tickets; `conference` = academic/international conference CFPs, abstract & paper deadlines, volunteer/travel calls; `journal` = journal special issues & calls for papers |
| snippet | text | one punchy sentence for the feed card |
| description | text | 2–5 sentences for the detail page, plain language |
| eligibility | text[], nullable | bullet points, e.g. `["Currently enrolled students", "Any discipline", "Teams of up to 4"]` — rendered as a ✓ checklist on the detail page |
| url | text | canonical link to apply/register — always link OUT, never mirror the application |
| deadline | timestamptz, nullable | null = ongoing (many vouchers have no deadline) |
| deadline_note | text, nullable | short qualifier when one date isn't the whole story, e.g. "Abstract deadline — full papers due 2 weeks later" or "Early-bird rate ends". Common for conferences/journals; shown next to the deadline on the detail page |
| region_tags | text[], nullable | e.g. `["UK", "Remote"]` — powers the region filter (UK / Remote / Global) |
| audience_tags | text[], nullable | who it's for: any of `students`, `researchers`, `professionals` — powers the audience filter; most items get one or two tags |
| source | text | `devpost`, `ai-search`, `user-submitted`, or a named feed — for debugging/trust |
| status | enum | `pending`, `approved`, `rejected` |
| link_status | enum, default `unchecked` | `ok`, `broken`, `unchecked` — set by the link-check job |
| last_checked_at | timestamptz, nullable | |
| discovered_at | timestamptz | |
| reviewed_at | timestamptz, nullable | |
| submitter_email | text, nullable | only for `user-submitted` rows, for follow-up — never shown publicly |

Also:
- Unique index on a **normalized `url`** (lowercase host, strip tracking
  params/trailing slash) to make dedup cheap.
- Store normalized lowercase `title` for fuzzy-match dedup
  (`string-similarity`, threshold ~0.85, checked only within the same
  category to keep it fast).
- A `discovery_runs` table (id, started_at, finished_at, counts
  found/inserted/skipped/failed per source, error notes) for run logging.

## Core Features — Phase 1 (build first, fully working end to end)

### Public site

- **Feed (home)**: cards for `approved` opportunities. Each card: category
  badge + urgency chip on top, then title, "org · region", snippet, and a
  circled → affordance. Above the feed: a lime "N live right now" pulse
  pill, the headline "Catch it *before it's gone.*" (with a lime underline
  highlight on the last words), and a one-line subhead: *"Hackathons, free
  credits, scholarships, conference and journal CFPs — surfaced while
  there's still time to act, so you never find out a day too late."*
- **Default sort: closing soonest first, ongoing items last.** Not newest
  first — the whole point is deadlines. (Optionally offer a "newest"
  secondary sort, but urgency is the default.)
- **Expired items**: exclude from the default feed once the deadline has
  passed. Keep the rows (don't delete — they feed dedup and stats).
- **Filters**: category chips (All + the eight categories, each with its
  dot color), a region chip row (All / UK / Remote / Global), and an
  audience chip row (All / Students / Researchers / Professionals). An item
  with `region_tags: ["UK","Remote"]` matches both region filters; same
  logic for audience. Filters combine (AND across the three rows).
- **Search**: simple keyword match across title + organization + snippet.
- **Empty state**: friendly "Nothing on the radar here — try a different
  category or clear your search."
- **Detail page** (`/opportunity/[id]` — a real route, for shareable links
  and SEO, not client-side state): back link, badges, title, org · region,
  two stat tiles (Deadline / Region — with `deadline_note` rendered as a
  small caption under the deadline when present), "About this opportunity",
  "Who's eligible" as a ✓ checklist, and a sticky bottom CTA:
  **"Apply at {host} ↗"** (lime button) with the caption *"Applications
  always happen on the original site — we just point you there."*
- **Calendar export**: `/calendar.ics` feed of all approved opportunities'
  deadlines. Subscribe once in Google/Outlook and new deadlines just show
  up. Cheap to build, disproportionately valuable.
- **Submit an opportunity** (`/submit`): heading "Spotted something we
  missed?", subhead "Five fields, thirty seconds — a human checks it before
  it goes live." Fields: what is it / who's running it / deadline (blank =
  ongoing) / category chips / source link / one-line description, plus an
  optional email for follow-up and optional "who's it for?" checkboxes
  (students / researchers / professionals — default students). Inserts `source: user-submitted`,
  `status: pending`. Success state: ✓ "Nice — it's in the queue" with a
  "Submit another" button. **Spam protection**: honeypot field + basic
  per-IP rate limit on the API route; validate the URL is http(s) and
  parseable before inserting.
- **Stats page** (`/stats`): "The radar, by the numbers." Grid of stat
  tiles derived from real queries only — e.g. total opportunities posted,
  currently live, closing this week, sources represented. **Never
  hard-code or estimate numbers you can't derive from the database** (the
  mockup's "~38k students reached" / "£4.6M value" tiles are placeholders —
  do not fabricate these; add them only if/when real analytics exist).
- **About page** (`/about`): static, personal, not corporate. Kicker "A
  note from the people who built this", headline "Nobody should miss out
  just because the opportunity never reached them." Three short paragraphs
  on the why (opportunities exist but never land in front of people; it's
  not just students — researchers miss conference and journal deadlines,
  and early-career professionals miss the free tools and events too;
  CatchIt is one place that gathers them while there's still time). Then a "Built by"
  block crediting all three by name with initial-avatars:
  - **Muhammad Ibrahim** — Founder — had the itch, built the first version
  - **Vishnu Ajith** — Co-builder — engineering & data
  - **Muhammed Sihan Haroon** — Co-builder — product & outreach
  Finish with a small dashed-border card "On the name": *We landed on
  CatchIt — it says exactly what the thing does: catch the opportunity
  before it slips past. Earlier contenders were Beacon, Signal and Loop,
  but nothing else felt as plain-spoken.*
- **Nav**: Feed / Submit / Stats / About + theme toggle. **Do not put Admin
  in the public nav** — admins reach `/admin` directly; students never see
  a hint of it.
- Genuinely fast and mobile-first. Basic SEO: per-page `<title>`/meta via
  the Metadata API, OpenGraph tags on detail pages (title, org, deadline),
  `sitemap.xml` including all approved opportunity pages.
- No login required to browse — auth is admin-only.

### Admin (protected route, Supabase Auth, small admin team)

Support a handful of named admin accounts (the three builders) rather than
one hardcoded login — it's a shared review queue.

- `/admin` — "Review queue": table of `pending` items showing title, meta
  line (org · category · source/submitter), status badge, and
  **Approve / Reject / Edit-then-approve** actions.
- On Approve: `status → approved`, `reviewed_at` set, Discord webhook fires.
- Rejected items stay in the table (`status: rejected`) so the discovery
  pipeline doesn't re-queue the same item daily — dedup checks rejected
  URLs too.
- Also surface: items whose `link_status` is `broken` (Phase 1.5), and the
  latest `discovery_runs` summaries, so admins can see the pipeline is alive
  without touching Supabase.

### Discovery pipeline (the automation core)

A single API route, `/api/cron/discover`, triggered daily by Vercel Cron
(protect it: check `Authorization: Bearer ${CRON_SECRET}`), doing in order:

1. **Hackathons — structured source first**: query Devpost's public
   listings endpoint for open/upcoming hackathons — more reliable than
   search for this category. Use AI search only to supplement (Unstop,
   HackerEarth, MLH-affiliated events).
2. **Conferences — semi-structured source**: WikiCFP is the de-facto
   index of academic CFPs. It has no official API, but exposes per-topic
   RSS feeds — pull a handful of relevant topic feeds (e.g. machine
   learning, software engineering, HCI, security) as the primary
   conference source, and use AI search to fill in what it misses. Wrap it
   in its own try/catch like every other source.
3. **Everything else — AI-search discovery**: for each of
   vouchers/credits, events, scholarships, internships, conferences
   (supplement), and journal calls, run 3–5 targeted Claude API calls
   (with `web_search` enabled) using specific, rotating queries — not one
   vague query. Examples:
   - "new free student software credits [current month/year]"
   - "GitHub Student Developer Pack new partner offers"
   - "AWS Educate OR Azure for Students new credits"
   - "student hackathon UK OR remote [current month/year]"
   - "undergraduate scholarship computer science UK deadline [year]"
   - "summer [year] software engineering internship UK applications open"
   - "international conference [field] [year] call for papers deadline"
   - "IEEE OR ACM conference [year] paper submission deadline"
   - "journal special issue call for papers [field] [month/year]"
   - "[publisher: Springer OR Elsevier OR MDPI] special issue deadline [year]"
   - "PhD funding OR research fellowship [field] deadline [year]"

   Prompt Claude (in that call's system prompt) to return **only** a JSON
   array matching the schema — including `snippet`, `description`,
   `eligibility` as a string array, `audience_tags`, and `deadline_note`
   when one date isn't the whole story — no prose, no markdown fences.
   Validate with zod before touching the database; discard items that fail
   validation instead of erroring the run. Discard items whose deadline is
   already in the past. For journal/conference items, prefer the official
   conference/journal page as `url` over aggregator links when both
   surface.
4. **Dedup**: normalized-URL check against existing rows (all statuses)
   plus fuzzy-title match within the same category. Skip matches.
5. **Insert** survivors as `status: pending`.
6. **Log** a row in `discovery_runs` with per-source counts.

Wrap each source call in its own try/catch with backoff so one flaky source
doesn't fail the whole run. Do not auto-approve anything in Phase 1 —
everything lands in the admin queue.

### Discord integration

- Env var `DISCORD_WEBHOOK_URL`.
- On admin Approve, POST a formatted embed (title, category, deadline,
  link) to the webhook.
- Keep it a small decoupled helper so it can later fire from the cron job
  if the moderation model changes.

## Phase 1.5 (after Phase 1 is stable and deployed)

- **Public JSON API**: read-only `/api/opportunities` (filterable by
  category/region) returning the same data as the feed — lets Moodle/VLE
  pages, society sites, and course pages embed it without scraping HTML.
- **Auto dead-link checking**: weekly cron pinging every `approved` URL,
  setting `link_status`/`last_checked_at`. Broken links surface in the
  admin panel only — never show students a known-dead link.

## Visibility, attribution & impact evidence (cheap now, valuable later)

The founder needs this project's impact to be *verifiable by third parties*
(portfolio, endorsements, visa evidence), so bake these in from the start:

- **Privacy-friendly analytics** (Plausible or Umami — no cookie banner
  needed) wired in from day one, with the dashboard **shared publicly** and
  linked from `/stats`. Real visitor/growth numbers beat self-reported ones.
- **Open-source hygiene**: public GitHub repo, MIT license, README with
  screenshots and architecture notes, meaningful commit history under the
  builders' real names/emails. The repo itself is evidence of who built what.
- **`/stats` stays live-derived** (already specified) — every number on it
  must be reproducible from the database.
- **Testimonial capture**: a small "Caught something thanks to CatchIt?
  Tell us" link (a simple form or mailto) in the footer. Concrete
  "this got me X" stories are the strongest impact evidence there is, and
  they're impossible to collect retroactively.
- **OpenGraph images** on the home and detail pages so shared links look
  professional in group chats, on LinkedIn, and in any press coverage.

## Explicitly Out of Scope for Phase 1 (note, don't build)

- **Email digest** (Phase 2): weekly digest via Resend, opt-in form. Design
  so adding a `subscribers` table later doesn't touch `opportunities`.
- **WhatsApp** (Phase 3): needs WhatsApp Business API (approval process,
  per-message cost). Flag explicitly if any Phase 1 decision would make it
  harder to add later, but don't build it.

## Non-functional requirements

- Mobile-first responsive layout; dark theme default with working
  light-theme toggle and no flash-of-wrong-theme.
- Every published item links to the *original* source; never rehost
  application content.
- Rate-limit/backoff on all external calls in the discovery job.
- Supabase Row Level Security: public role can `select` only
  `status = 'approved'` rows (and never `submitter_email`); inserts from
  the submit form go through a server route; admin operations require an
  authenticated session.
- All secrets (`ANTHROPIC_API_KEY`, `DISCORD_WEBHOOK_URL`, `CRON_SECRET`,
  Supabase service key) server-side only, documented in `.env.example`.

## Build order — milestones (check in after each)

1. **Scaffold + schema**: repo structure, Next.js + Tailwind + fonts +
   theme system, Supabase client via `.env.example`, migration file for
   `opportunities` + `discovery_runs` + enums + indexes + RLS.
2. **Public site**: feed (sort/filters/search/urgency chips), detail page,
   calendar export, submit form, stats page, about page, SEO.
3. **Admin**: Supabase Auth (multi-admin), review queue with
   approve/reject/edit.
4. **Discovery pipeline**: `/api/cron/discover`, Devpost + AI search, zod
   validation, dedup, run logging, `vercel.json` cron config.
5. **Discord webhook** on approve.
6. **README**: env vars, how to run the discovery job manually for
   testing, how to deploy to Vercel, how to add an admin account.

Treat Phase 1.5 and anything cosmetic as lower priority — get the core
loop (feed → admin → discovery → Discord) working end to end first. If
anything is ambiguous or needs a decision (naming, styling detail, auth
specifics), ask before building rather than guessing silently.
