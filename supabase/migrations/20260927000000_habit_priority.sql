-- Priority label for habits that matter most.
-- Run in Supabase: SQL Editor -> New query -> paste -> Run (or `supabase db push`).
--
-- Existing habits default to not-priority, so nothing changes for them. The habits table's
-- existing owner-only RLS policies cover the new column; no policy changes are needed.

alter table public.habits
  add column priority boolean not null default false;
