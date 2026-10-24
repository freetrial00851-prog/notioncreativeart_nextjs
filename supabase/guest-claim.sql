-- One-time links that prove a signed-in buyer owns the mailbox their guest orders were paid with.
-- Only the SHA-256 hash of the token is stored. Service-role only (RLS on, no policies).
-- Safe to re-run.
create table if not exists public.claim_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.claim_tokens enable row level security;
revoke all on public.claim_tokens from anon, authenticated;
