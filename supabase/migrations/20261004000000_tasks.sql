-- One-off tasks: things done once ("Book the dentist"), optionally by a due date.
-- Run in Supabase: SQL Editor -> New query -> paste -> Run (or `supabase db push`).
--
-- A task is finished by setting completed_on, completed_at and xp_earned together, and reopened by
-- clearing them. Like habit completions, the XP is stored with the task when it's ticked off, and
-- every total is derived from these rows, never kept as a counter.

create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 80),
  icon         text not null default '⭐' check (char_length(icon) <= 16),
  difficulty   public.difficulty not null default 'medium',
  due_on       date,                                  -- the user's LOCAL calendar day; null = someday
  completed_on date,                                  -- the LOCAL day it was ticked off; null = open
  completed_at timestamptz,
  xp_earned    integer not null default 0 check (xp_earned >= 0 and xp_earned <= 1000),
  created_at   timestamptz not null default now(),
  -- Finished means all three are set; open means none are (and no XP).
  constraint tasks_completion_consistent check (
    (completed_on is null and completed_at is null and xp_earned = 0)
    or (completed_on is not null and completed_at is not null)
  )
);

create index tasks_user_idx on public.tasks (user_id);

alter table public.tasks enable row level security;

create policy "tasks: owner can read"   on public.tasks for select using (auth.uid() = user_id);
create policy "tasks: owner can insert" on public.tasks for insert with check (auth.uid() = user_id);
create policy "tasks: owner can update" on public.tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks: owner can delete" on public.tasks for delete using (auth.uid() = user_id);
