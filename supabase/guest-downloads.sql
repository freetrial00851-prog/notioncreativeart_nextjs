-- Guest checkout: PDF delivery without an account. ADDITIVE ONLY (one new table), safe to re-run.
--
-- A buyer who pays without an account gets a long random link (/d/<token>). Only a SHA-256 hash of the token is
-- stored here, so a leaked database does not leak working links. The link opens the order's patterns for 30 days
-- and at most `max_downloads` file downloads; each download is a 60-second signed URL minted by an Edge Function.

create table if not exists public.download_grants (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  token_hash    text not null unique,
  expires_at    timestamptz not null,
  max_downloads int  not null default 10,
  downloads     int  not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists download_grants_order_idx on public.download_grants (order_id);

-- Service role (Edge Functions) only: no policies, no browser access.
alter table public.download_grants enable row level security;
revoke all on public.download_grants from anon, authenticated;
