-- Generic rate-limit event log — Edge Functions insert a row per attempt and
-- check how many rows exist for a given key within a time window before
-- allowing an action. No RLS policies needed here: only Edge Functions
-- (using the service-role key) ever touch this table, never the browser
-- directly.

create table if not exists public.rate_limit_events (
  id bigserial primary key,
  key text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_events_key_created_at_idx
  on public.rate_limit_events (key, created_at);

-- Housekeeping: old rows are cheap to accumulate but no longer useful once
-- their window has passed. Safe to run manually any time; nothing depends
-- on rows older than a day for any current rate limit window.
delete from public.rate_limit_events where created_at < now() - interval '1 day';
