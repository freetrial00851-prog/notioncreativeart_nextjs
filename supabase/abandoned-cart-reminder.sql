-- Abandoned-cart recovery email infrastructure
-- Run manually in Supabase SQL Editor on project anlsellghialszuuvipw:
--   https://supabase.com/dashboard/project/anlsellghialszuuvipw/sql/new
--
-- Adds:
--   • cart_items.updated_at (staleness for 24h abandonment rule)
--   • cart_abandoned_reminders (7-day dedupe tracking)
--   • get_abandoned_cart_candidates() RPC (used by edge function + manual tests)
--   • Optional pg_cron schedule (commented — enable pg_cron + pg_net first)

-- ── 1. cart_items.updated_at ────────────────────────────────────────────────

alter table public.cart_items
  add column if not exists updated_at timestamptz not null default now();

-- Backfill existing rows
update public.cart_items
set updated_at = added_at
where updated_at is null or updated_at < added_at;

create or replace function public.cart_items_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cart_items_updated_at on public.cart_items;
create trigger cart_items_updated_at
  before insert or update on public.cart_items
  for each row
  execute function public.cart_items_set_updated_at();

-- ── 2. Reminder send log (one row per email sent) ───────────────────────────

create table if not exists public.cart_abandoned_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sent_at timestamptz not null default now(),
  item_count int not null default 0
);

create index if not exists cart_abandoned_reminders_user_sent_idx
  on public.cart_abandoned_reminders (user_id, sent_at desc);

alter table public.cart_abandoned_reminders enable row level security;
-- No RLS policies — only service role (edge function) reads/writes this table.

-- ── 3. Candidate query (logged-in users, confirmed email, 24h+ stale cart) ──

create or replace function public.get_abandoned_cart_candidates()
returns table (
  user_id uuid,
  email text,
  cart_updated_at timestamptz,
  item_count bigint
)
language sql
security definer
set search_path = public, auth
as $$
  select
    c.user_id,
    u.email::text,
    max(c.updated_at) as cart_updated_at,
    count(*)::bigint as item_count
  from public.cart_items c
  inner join auth.users u on u.id = c.user_id
  inner join public.products p on p.id = c.product_id
    and p.active = true
    and coalesce(p.price, 0) > 0
    and p.deleted_at is null
  where u.email is not null
    and u.email_confirmed_at is not null
  group by c.user_id, u.email
  having max(c.updated_at) < now() - interval '24 hours'
    and not exists (
      select 1
      from public.cart_abandoned_reminders r
      where r.user_id = c.user_id
        and r.sent_at > now() - interval '7 days'
    );
$$;

revoke all on function public.get_abandoned_cart_candidates() from public;
grant execute on function public.get_abandoned_cart_candidates() to service_role;

-- ── 4. Manual test queries ──────────────────────────────────────────────────
--
-- Simulate abandonment (replace USER_ID):
--   update public.cart_items
--   set updated_at = now() - interval '25 hours'
--   where user_id = 'USER_ID';
--
-- Should appear as candidate:
--   select * from public.get_abandoned_cart_candidates();
--
-- Should NOT appear (< 24h):
--   update public.cart_items set updated_at = now() - interval '2 hours' where user_id = 'USER_ID';
--
-- Should NOT appear (reminded within 7 days):
--   insert into public.cart_abandoned_reminders (user_id, item_count)
--   values ('USER_ID', 1);

-- ── 5. Optional hourly pg_cron (Supabase Pro + pg_cron + pg_net enabled) ───
--
-- 1. Store CRON_SECRET in Edge Function secrets:
--      npx supabase secrets set CRON_SECRET=your_long_random_secret --project-ref anlsellghialszuuvipw
-- 2. Deploy abandoned-cart-reminder edge function (--no-verify-jwt)
-- 3. Uncomment and run (replace YOUR_CRON_SECRET):
--
-- select cron.schedule(
--   'abandoned-cart-reminder-hourly',
--   '0 * * * *',
--   $$
--   select net.http_post(
--     url := 'https://anlsellghialszuuvipw.supabase.co/functions/v1/abandoned-cart-reminder',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer YOUR_CRON_SECRET'
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
