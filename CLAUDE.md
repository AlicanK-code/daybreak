# QuestLog: project guide for Claude

A gamified daily habit tracker. It's a portfolio piece that the owner also uses every day, so keep the code clean, typed and tested, and keep the experience fun.

## Stack
- React 19 + TypeScript + Vite
- Tailwind CSS v4 (theme tokens in `src/index.css` under `@theme`)
- Motion (`motion/react`) for animation
- TanStack Query for server state
- Supabase (Auth + Postgres + Row Level Security)
- Recharts (lazy-loaded in the Stats tab)
- Vitest for tests, oxlint for linting, GitHub Actions for CI

## Commands
- `npm run dev`: start the dev server (http://localhost:5173)
- `npm test`: run the unit tests (Vitest)
- `npm run lint`: lint with oxlint
- `npm run typecheck`: `tsc -b`
- `npm run build`: production build

Before saying a change is done, run lint, typecheck, test and build. They must all pass, because CI runs the same four.

## Architecture
- `src/game/`: the **pure** game engine (XP, levels, streaks, badges, stats), with no React or I/O. Every rule change needs a test in `game.test.ts`.
- `src/data/repo.ts`: the `Repo` interface. The UI only talks to this.
  - `supabase.ts`: the real backend (maps snake_case rows to camelCase models).
  - `demo.ts`: a localStorage implementation with seeded history, for visitors without an account.
  - `queries.ts`: TanStack Query hooks. Completing and undoing a habit are optimistic and roll back on error.
- `src/views/`: Shell (tabs and celebration detection), TodayView, StatsView, BadgesView, AuthScreen.
- `src/components/`: HabitCard, PlayerCard, HabitForm, Modal, Celebrations (toasts and the level-up modal).
- `src/lib/`: dates, sound (Web Audio, no audio files), confetti, types.
- `supabase/migrations/`: the SQL schema and RLS policies. Add a **new** migration file for schema changes and never edit an old one.

## Key design rules
- **Completions are the single source of truth.** XP totals, levels, streaks and badges are derived by `computeProgress()` and never stored as counters.
- **`xp_earned` is stored per completion** because it depends on the streak at the moment of completion.
- **Day keys are local calendar dates** (`YYYY-MM-DD`). Use the helpers in `src/lib/dates.ts` for all date maths; they work at noon UTC to be DST-safe.
- Any new feature that touches data must work in **both** Repo implementations.
- Celebrations must respect `prefers-reduced-motion` and the mute toggle.
- Tables must have RLS enabled, with owner-only policies.

## Game rules (current)
- Base XP: easy 10, medium 20, hard 35.
- Streak bonus: +5% for each prior consecutive day, capped at +50%.
- Level curve: total XP needed for level n is `60 × (n − 1)^1.8`.
- A streak stays alive until the end of today and breaks after a full missed day.

## Conventions
- Functional components and hooks, with named exports (except `App`).
- Keep game logic out of components; put it in `src/game/` with tests.
- Commit messages are short and in the imperative mood ("Add weekly schedules").
- Never commit `.env`.

## Roadmap
1. Custom schedules per habit (e.g. Mon/Wed/Fri), so streaks count only scheduled days
2. One-off tasks alongside daily habits
3. Daily bonus quests ("complete 3 hard habits before noon")
4. Coins and a personal reward shop
5. PWA (installable) and reminder notifications
6. Drag-to-reorder habits (`sort_order` already exists)
