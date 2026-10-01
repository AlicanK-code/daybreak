-- Custom schedules: which weekdays a habit is due.
-- Run in Supabase: SQL Editor -> New query -> paste -> Run (or `supabase db push`).
--
-- A list of periods, oldest first: [{"from": "2026-10-01", "days": [0, 2, 4]}], where days are
-- weekdays (0 = Monday ... 6 = Sunday). Each change applies from its day on, so past days keep the
-- schedule they had. An empty list means every day, so existing habits are unchanged. The habits
-- table's existing owner-only RLS policies cover the new column; no policy changes are needed.

alter table public.habits
  add column schedule jsonb not null default '[]'::jsonb
  constraint habits_schedule_is_array check (jsonb_typeof(schedule) = 'array');
