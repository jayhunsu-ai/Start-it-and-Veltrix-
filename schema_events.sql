-- ============================================================
-- START-IT — SCHEMA ADDITION: events table (analytics)
-- Safe to re-run. Additive only — does not touch existing tables.
-- Run this in the same Supabase SQL editor after the main schema.
-- ============================================================

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),

  event text not null,

  -- nullable: pre-signup funnel steps (segment_selected, tool_used)
  -- happen before a user_id exists
  user_id uuid references public.profiles(id) on delete set null,

  properties jsonb,

  created_at timestamptz not null default now()
);

create index if not exists events_event_idx
  on public.events(event);

create index if not exists events_user_id_idx
  on public.events(user_id);

create index if not exists events_event_created_idx
  on public.events(event, created_at desc);

-- RLS: this table is written by the backend only (service role key,
-- which bypasses RLS by design). No client-side reads/writes needed,
-- so RLS stays on with no policies — locks it down from anon/authenticated
-- entirely, matching the "revoke all" pattern in the main schema.
alter table public.events enable row level security;

revoke all on table public.events from anon, authenticated;

select 'events table installed — analytics ready.' as status;
