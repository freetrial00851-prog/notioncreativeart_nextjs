-- Paddle alongside Lemon Squeezy. ADDITIVE ONLY: nothing is renamed or dropped, and every
-- existing product/order keeps behaving exactly as before (provider defaults to Lemon Squeezy).
-- Safe to re-run.

-- ─── products: which provider sells it + the Paddle price ids ────────────────────────────────
-- checkout_provider NULL = use the site default (Lemon Squeezy). Set per product in the admin editor.
alter table public.products add column if not exists checkout_provider text;
alter table public.products drop constraint if exists products_checkout_provider_check;
alter table public.products add constraint products_checkout_provider_check
  check (checkout_provider is null or checkout_provider in ('lemonsqueezy', 'paddle'));

-- Paddle price ids (pri_...). Sandbox and live are separate Paddle accounts with different ids.
alter table public.products add column if not exists paddle_price_id text;          -- live
alter table public.products add column if not exists paddle_price_id_sandbox text;  -- test
alter table public.products add column if not exists paddle_product_id text;        -- optional (pro_...)

-- One Paddle price must not be attached to two patterns (would sell the wrong file).
create unique index if not exists products_paddle_price_id_key
  on public.products (paddle_price_id) where paddle_price_id is not null;
create unique index if not exists products_paddle_price_id_sandbox_key
  on public.products (paddle_price_id_sandbox) where paddle_price_id_sandbox is not null;

-- ─── orders: provider-neutral identity ───────────────────────────────────────────────────────
alter table public.orders add column if not exists provider text not null default 'lemonsqueezy';
alter table public.orders drop constraint if exists orders_provider_check;
alter table public.orders add constraint orders_provider_check check (provider in ('lemonsqueezy', 'paddle'));

alter table public.orders add column if not exists provider_order_id text;       -- LS order id, or Paddle txn_...
alter table public.orders add column if not exists display_order_number text;    -- what the customer sees
alter table public.orders add column if not exists environment text not null default 'live';
alter table public.orders drop constraint if exists orders_environment_check;
alter table public.orders add constraint orders_environment_check check (environment in ('sandbox', 'live'));
alter table public.orders add column if not exists tax_amount numeric(10,2);
alter table public.orders add column if not exists access_token text;            -- guest download link secret (later step)

-- Existing Lemon Squeezy orders: copy their id into the neutral columns.
update public.orders
   set provider_order_id = lemon_order_id,
       display_order_number = coalesce(display_order_number, lemon_order_id)
 where provider_order_id is null and lemon_order_id is not null;

-- Paddle orders have no Lemon id. The existing UNIQUE on lemon_order_id stays (NULLs may repeat).
alter table public.orders alter column lemon_order_id drop not null;

-- New idempotency key for webhooks (a real constraint so upsert ... on conflict works).
alter table public.orders drop constraint if exists orders_provider_order_key;
alter table public.orders add constraint orders_provider_order_key unique (provider, provider_order_id);

-- ─── webhook audit / idempotency ─────────────────────────────────────────────────────────────
create table if not exists public.payment_events (
  id            uuid primary key default gen_random_uuid(),
  provider      text not null,
  event_id      text not null,                 -- Paddle evt_...
  event_type    text not null,
  order_id      uuid references public.orders(id) on delete set null,
  payload       jsonb,
  received_at   timestamptz not null default now(),
  processed_at  timestamptz,
  error         text,
  unique (provider, event_id)
);
alter table public.payment_events enable row level security;   -- no policies: service role only
revoke all on public.payment_events from anon, authenticated;
