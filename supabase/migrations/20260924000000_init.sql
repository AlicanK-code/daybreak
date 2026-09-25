-- QuestLog initial schema
-- Run in Supabase: SQL Editor -> New query -> paste -> Run
-- (or `supabase db push` if you use the Supabase CLI)
--
-- Design notes:
--   * XP, levels, streaks and badges are NOT stored. They are derived from
--     `completions`, which is the single source of truth. This keeps the data
--     consistent (no counters drifting out of sync) and makes the game rules
--     easy to change without migrating data.
--   * `xp_earned` IS stored per completion, because it depends on the streak at
--     the moment of completion — recomputing it later would rewrite history.
--   * Row Level Security ensures a user can only ever see or modify their own rows.

create type public.difficulty as enum ('easy', 'medium', 'hard');

-- ---------------------------------------------------------------------------
-- habits: the recurring daily tasks a user wants to complete
-- ---------------------------------------------------------------------------
create table public.habits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 80),
  icon        text not null default '⭐' check (char_length(icon) <= 16),
  difficulty  public.difficulty not null default 'medium',
  sort_order  integer not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now()
);

create index habits_user_idx on public.habits (user_id) where archived_at is null;

-- ---------------------------------------------------------------------------
-- completions: one row per habit per day it was completed
-- ---------------------------------------------------------------------------
create table public.completions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  habit_id     uuid not null references public.habits (id) on delete cascade,
  completed_on date not null,               -- the user's LOCAL calendar day
  xp_earned    integer not null check (xp_earned >= 0 and xp_earned <= 1000),
  completed_at timestamptz not null default now(),
  unique (habit_id, completed_on)            -- can't complete the same habit twice in a day
);

create index completions_user_day_idx on public.completions (user_id, completed_on desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.habits enable row level security;
alter table public.completions enable row level security;

create policy "habits: owner can read"   on public.habits for select using (auth.uid() = user_id);
create policy "habits: owner can insert" on public.habits for insert with check (auth.uid() = user_id);
create policy "habits: owner can update" on public.habits for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habits: owner can delete" on public.habits for delete using (auth.uid() = user_id);

create policy "completions: owner can read" on public.completions for select using (auth.uid() = user_id);
create policy "completions: owner can delete" on public.completions for delete using (auth.uid() = user_id);
-- On insert, also verify the habit belongs to the same user, so nobody can
-- attach completions to someone else's habit id.
create policy "completions: owner can insert" on public.completions for insert with check (
  auth.uid() = user_id
  and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid())
);
