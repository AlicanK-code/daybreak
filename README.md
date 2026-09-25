# QuestLog ⚔️

**A gamified daily habit tracker.** Complete habits to earn XP, level up, keep streaks alive and unlock trophies, with confetti, sound effects and level-up fanfare to make each tick feel rewarding.

<p>
  <img src="docs/today.png" alt="Today view" width="520" />
  <img src="docs/levelup.png" alt="Level-up celebration on mobile" width="200" />
</p>

<p>
  <img src="docs/stats.png" alt="Stats view with XP chart and activity heatmap" width="520" />
  <img src="docs/trophies.png" alt="Trophy cabinet" width="200" />
</p>

## Features

- **Daily habits** that reset every day, each with an icon and difficulty (Easy / Medium / Hard)
- **XP & levels.** Harder habits give more XP. A streak adds +5% per day, up to +50%. Level titles go from *Novice* to *Mythic*.
- **Streaks** per habit and overall, with current and best values
- **14 trophies** in bronze, silver and gold tiers, with progress bars for locked ones
- **Celebrations**: a confetti burst from the button, floating "+XP" text, synthesized sound effects, a level-up modal and a perfect-day celebration
- **Stats**: 30-day XP chart, a 16-week activity heatmap, and completion rate per habit
- **Accounts** with Supabase Auth, data in Postgres, and Row Level Security
- **Demo mode**: try it without an account; data is kept in the browser
- Mobile-first layout, keyboard accessible, respects `prefers-reduced-motion`

## Tech stack

| Area | Choice |
|---|---|
| UI | React 19, TypeScript, Vite |
| Styling / motion | Tailwind CSS v4, Motion (Framer Motion) |
| Server state | TanStack Query (optimistic updates) |
| Backend | Supabase (Postgres + Auth + RLS) |
| Charts | Recharts (lazy-loaded) |
| Testing / CI | Vitest, oxlint, GitHub Actions |

## Architecture

```
src/
├── game/          # Pure game engine: XP, levels, streaks, badges, stats (+ unit tests)
├── data/          # Repo interface with Supabase and demo (localStorage) implementations
│   ├── repo.ts
│   ├── supabase.ts
│   ├── demo.ts
│   └── queries.ts # TanStack Query hooks, optimistic complete/undo
├── views/         # Today, Stats, Trophies, Auth, Shell
├── components/    # HabitCard, PlayerCard, HabitForm, Modal, celebrations
└── lib/           # dates, sound (Web Audio), confetti, types
supabase/migrations/  # SQL schema + RLS policies
```

**Design decisions:**

- **Completions are the single source of truth.** XP totals, levels, streaks and trophies are *derived* by a pure function (`computeProgress`), not stored as counters. They can't drift out of sync, and changing a game rule doesn't need a data migration.
- **XP is stored per completion.** The streak bonus depends on the streak at the moment you complete a habit. Recomputing it later would rewrite history.
- **Repository pattern.** The UI talks to a `Repo` interface. Supabase and demo mode are two implementations of it, so adding another backend means one new file.
- **Optimistic updates.** Ticking a habit updates the UI and starts the celebration straight away. If the server rejects the write, the change is rolled back and you see a toast.
- **Dates are local calendar days** (`YYYY-MM-DD`). Date maths is done at noon UTC, so DST changes can't break a streak (this is tested).

## Getting started

### 1. Run it locally (demo mode, no setup)

```bash
npm install
npm run dev
```

Open http://localhost:5173 and click **Try the demo**.

### 2. Connect Supabase (real accounts and sync)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the dashboard, open **SQL Editor → New query**, paste the contents of `supabase/migrations/20260924000000_init.sql` and click **Run**.
3. Go to **Project Settings → API** and copy the *Project URL* and the *anon public* key.
4. Copy `.env.example` to `.env` and fill in both values.
5. Under **Authentication → URL Configuration**, set the *Site URL* to your app's URL (`http://localhost:5173` for local development, then your deployed URL).
6. Restart `npm run dev`. You can now create an account.

> Tip: to skip email confirmation during development, turn off **Authentication → Providers → Email → Confirm email**.

### 3. Deploy (free) to Vercel

1. Push the repo to GitHub.
2. On [vercel.com](https://vercel.com), click **Add New → Project** and import the repo. The Vite preset is detected automatically.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables, then deploy.
4. Add the Vercel URL to Supabase's Site URL and Redirect URLs.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm test` | Run the unit tests |
| `npm run lint` | Lint with oxlint |
| `npm run typecheck` | Check types |
| `npm run build` | Production build to `dist/` |

## Game rules

| Difficulty | Base XP |
|---|---|
| Easy | 10 |
| Medium | 20 |
| Hard | 35 |

- **Streak bonus:** +5% for each consecutive day you completed the habit before today, up to +50%.
- **Level curve:** the total XP needed for level *n* is `60 × (n − 1)^1.8`.
- A streak stays alive until the end of today and breaks only after a full missed day.

## Roadmap ideas

- [ ] Weekly / custom-day schedules (e.g. gym Mon–Wed–Fri)
- [ ] One-off tasks alongside daily habits
- [ ] Daily bonus quests ("complete 3 hard habits")
- [ ] Coins and a personal reward shop
- [ ] PWA and push reminders
- [ ] Drag-to-reorder habits
