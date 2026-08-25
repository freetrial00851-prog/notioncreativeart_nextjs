-- rate_limit_events: server-side only (Supabase Edge Functions via service-role key).
-- Enable RLS with NO public policies — blocks anon/authenticated REST access.
-- Service role bypasses RLS and keeps rate limiting working in Edge Functions.

alter table public.rate_limit_events enable row level security;

-- Intentionally no policies: only service-role / backend may read/write.
