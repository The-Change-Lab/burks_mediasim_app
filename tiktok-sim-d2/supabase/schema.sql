-- =====================================================================
--  Run this once in Supabase: Dashboard -> SQL Editor -> New query -> Run
-- =====================================================================

-- 1) Raw event log: one row per interaction
create table if not exists public.events (
  id              bigint generated always as identity primary key,
  received_at     timestamptz not null default now(),
  session_id      text,
  participant_id  text,
  seq             integer,
  event_type      text not null,
  video_id        text,
  context         text,
  video_time      double precision,
  client_ts       timestamptz,
  ms_since_start  bigint,
  data            jsonb
);

create index if not exists events_participant_idx on public.events (participant_id);
create index if not exists events_type_idx on public.events (event_type);

-- 2) Security: the public website can ADD rows but can never READ them.
--    Only you (in the dashboard) can see the data.
alter table public.events enable row level security;

drop policy if exists "website can insert events" on public.events;
create policy "website can insert events"
  on public.events for insert
  to anon
  with check (true);

-- 3) Handy summary: one row per video view (for analysis/export)
create or replace view public.video_views
  with (security_invoker = on) as
select
  participant_id,
  session_id,
  video_id,
  context,
  (data->>'position')::int          as position,
  (data->>'dwell_ms')::int          as dwell_ms,
  (data->>'watch_ms')::int          as watch_ms,
  (data->>'hidden_ms')::int         as hidden_ms,
  (data->>'pause_count')::int       as pause_count,
  (data->>'loop_count')::int        as loop_count,
  (data->>'pct_watched')::float     as pct_watched,
  (data->>'completed')::boolean     as completed,
  (data->>'liked')::boolean         as liked,
  data->>'exit_reason'              as exit_reason,
  client_ts
from public.events
where event_type = 'video_view_end';

revoke all on public.video_views from anon, authenticated;
