-- Generic rate-limit event log — Edge Functions insert a row per attempt and
-- check how many rows exist for a given key within a time window before
-- allowing an action. RLS enabled with no public policies: only Edge Functions
-- (service-role key) touch this table; browser/anon/authenticated are blocked.

create table if not exists public.rate_limit_events (
  id bigserial primary key,
  key text not null,
  created_at timestamptz not null default now()
);

alter table public.rate_limit_events enable row level security;

create index if not exists rate_limit_events_key_created_at_idx
  on public.rate_limit_events (key, created_at);

-- Housekeeping: old rows are cheap to accumulate but no longer useful once
-- their window has passed. Safe to run manually any time; nothing depends
-- on rows older than a day for any current rate limit window.
delete from public.rate_limit_events where created_at < now() - interval '1 day';
