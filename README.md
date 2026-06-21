# ML SysDesign — Duolingo-style PWA

A gamified PWA for learning ML system design. Skill tree, XP, streaks, hearts,
leagues, achievements, and case studies walked through step by step — like Duolingo.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Supabase (Postgres + Auth + RLS)
- `next-pwa` for installability + offline shell
- Framer Motion (kept light), `lucide-react` icons
- `gray-matter` + `zod` for the markdown content pipeline
- `vitest` for pure-logic tests

## Getting started

1. **Install deps**

   ```bash
   pnpm install
   ```

2. **Provision Supabase**

   - Create a free project at https://supabase.com
   - Open the SQL editor and run `supabase/migrations/0001_init.sql`
   - Copy `.env.example` to `.env.local` and paste your URL, anon key, and
     service role key.

3. **Seed content**

   ```bash
   pnpm ingest
   ```

   Without env vars set, this prints a dry-run; with them set it writes topics,
   lessons, and cases to Supabase.

4. **Run**

   ```bash
   pnpm dev
   ```

   Open http://localhost:3000.

## Authoring content

All content is `.md` files under `/content`:

- `content/framework.md` — the 6-stage framework
- `content/topics/<order>-<slug>.md` — skill-tree topics with lesson sequences
- `content/cases/<slug>.md` — full case studies

See `content/README.md` for the schema. Edit/add files, then run `pnpm ingest`
to push to Supabase. The app picks up new content with no code changes.

## Tests

```bash
pnpm test           # runs vitest suite
pnpm typecheck      # tsc --noEmit
pnpm build          # production build
```

## Project layout

```
content/                       # author-edited markdown — the source of truth
  framework.md
  topics/*.md
  cases/*.md
scripts/
  ingest-content.ts            # parses /content and seeds Supabase
src/
  app/
    page.tsx                   # landing
    login/                     # magic-link login
    onboarding/                # first-run wizard
    learn/                     # skill tree
    lesson/[topic]/[order]/    # lesson player
    case/[slug]/               # case player (stage stepper + solution reveal)
    leaderboard/               # weekly league
    profile/                   # avatar, stats, achievements
    actions/progress.ts        # server actions: complete lesson/stage, hearts
    auth/callback/route.ts
  components/
    lesson/PromptRenderer.tsx  # MCQ / fill / order / match renderer
    lesson/LessonPlayer.tsx    # drives a sequence of prompts
    case/StageStepper.tsx
    case/SolutionReveal.tsx
    gamification/HUD.tsx       # top bar: XP, level, hearts, streak
    gamification/BottomNav.tsx
    InstallPrompt.tsx
  lib/
    content/                   # parser + schemas + server loader (Supabase + fs fallback)
    supabase/                  # browser, server, admin clients
    grading/                   # pure grading per prompt type
    gamification/              # xp, streak, hearts, achievements, leagues
    offline/queue.ts           # IndexedDB queue (offline progress sync hook)
supabase/migrations/0001_init.sql
public/manifest.webmanifest
```

## Deploying to Vercel

1. **Push the repo to GitHub** (or any git host Vercel supports). Vercel imports from git.
2. **Create the Vercel project**: `vercel.com → Add New → Project → Import` the repo.
   - Framework preset auto-detects as **Next.js**. Keep the defaults
     (`pnpm install`, `pnpm build`, output `.next`).
3. **Set environment variables** in `Project Settings → Environment Variables`,
   for all three environments (Production / Preview / Development):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (only needed if you intend to run `pnpm ingest`
     from a Vercel build step; otherwise leave it out — ingest can run from your
     laptop)
4. **Configure Supabase Auth** so the magic link works on production:
   - In Supabase → `Authentication → URL Configuration`
   - **Site URL**: `https://<your-vercel-domain>`
   - **Redirect URLs**: add `https://<your-vercel-domain>/auth/callback` and any
     preview-deployment URL pattern (`https://*.vercel.app/auth/callback`).
5. **First deploy**: trigger from Vercel dashboard or `git push`. Build takes
   ~1 minute.
6. **Run the Supabase migration** (one-time): open Supabase SQL editor and run
   `supabase/migrations/0001_init.sql` then `supabase/migrations/0002_mental_map.sql`.
7. **Seed content** (one-time, from your laptop):
   ```bash
   pnpm ingest
   ```
   Re-run this whenever you edit `/content/*.md`.

After that, the app at `https://<your-vercel-domain>` is live. Users sign up
with a magic link, work through the skill tree, and progress is stored in
Supabase. Runtime cost = Supabase usage only.

## What's next (post-MVP)

- Wire the offline queue into the runners so progress can be saved offline and
  drained when reconnected.
- Replace the placeholder PNG icons in `public/icons/` with real maskable PNGs.
- Add diagnostic-quiz logic in onboarding (currently stubbed) to suggest a
  starting topic.
- Add bot users / seed data so the leaderboard is populated for solo testing.
