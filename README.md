# CatchIt

**Catch it before it's gone.**

CatchIt automatically discovers and publishes career-relevant opportunities for students, researchers, and early-career professionals — hackathons, scholarships, internships, free software/cloud credits, tech events, and conference & journal CFPs — so people stop missing deadlines they'd otherwise never hear about.

Built by [Muhammad Ibrahim](https://github.com/m-khan-97), Vishnu Ajith, and Muhammed Sihan Haroon.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) · TypeScript · Tailwind CSS v4
- [Supabase](https://supabase.com) — Postgres + Auth
- [Anthropic API](https://www.anthropic.com) (`@anthropic-ai/sdk`) with `web_search` for automated discovery
- Vercel + Vercel Cron for hosting and scheduling
- Discord incoming webhook for review notifications

## Project status

Full build plan: [`catchit-build-plan.md`](catchit-build-plan.md).

- [x] **Milestone 1** — Scaffold, design system, database schema, Supabase auth plumbing
- [x] **Milestone 2** — Public site: feed, filters, search, detail pages, calendar export, submission form, stats, about page, SEO
- [ ] **Milestone 3** — Admin panel (multi-admin review queue)
- [ ] **Milestone 4** — Discovery pipeline (Devpost + AI search + dedup)
- [ ] **Milestone 5** — Discord webhook integration
- [ ] **Milestone 6** — Polish, docs, deploy

Progress is tracked via [GitHub Milestones](../../milestones).

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project + keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database setup

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Run the migration in `supabase/migrations/` via the SQL Editor (or `supabase db push` once linked).
3. Optionally run `supabase/seed.sql` for sample data to develop against.
4. Copy your Project URL, `anon` key, and `service_role` key from **Project Settings → API** into `.env.local`.

See `.env.example` for every environment variable the app needs and what each one is for.

## Non-negotiables

- Every published opportunity links to the *original* source — CatchIt never rehosts application content.
- No login required to browse; auth is admin-only.
- Row Level Security enforced at the database layer, not just in application code.
