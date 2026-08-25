-- NotionCreativeArt — Supabase schema
-- Run this in Supabase Dashboard → SQL Editor → New query → paste → Run

-- ============================================================
-- PROFILES (extends Supabase auth.users with app-level fields)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs up (Google or email)
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- CATEGORIES (Women/Men/Kids-style top nav → Amigurumi/Wearables/Home etc.)
-- ============================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0
);

-- ============================================================
-- PRODUCTS (digital PDF crochet patterns)
-- ============================================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  skill_level text check (skill_level in ('beginner','intermediate','advanced')),
  price numeric(10,2) not null,
  compare_at_price numeric(10,2), -- for showing "sale" strike-through price
  category_id uuid references public.categories(id),
  images text[] not null default '{}', -- Supabase Storage public URLs
  pdf_pages int,
  lemon_product_id text,
  lemon_variant_id text not null,
  active boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create index on public.products (category_id);
create index on public.products (active);

-- ============================================================
-- ORDERS (one row per Lemon Squeezy order/webhook)
-- ============================================================
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  lemon_order_id text not null unique,
  customer_email text not null,
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  status text not null default 'pending', -- pending / paid / refunded
  product_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ============================================================
-- PURCHASES (one row per product a user owns — powers "My Patterns")
-- ============================================================
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  product_id uuid not null references public.products(id),
  order_id uuid not null references public.orders(id),
  purchase_date timestamptz not null default now(),
  unique (user_id, product_id)
);

-- ============================================================
-- WISHLIST
-- ============================================================
create table public.wishlist (
  user_id uuid not null references auth.users(id),
  product_id uuid not null references public.products(id),
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.purchases enable row level security;
alter table public.wishlist enable row level security;

-- Categories & active products: publicly readable (storefront browsing needs no login)
create policy "public read categories" on public.categories for select using (true);
create policy "public read active products" on public.products for select using (active = true);

-- Profiles: user can read/update only their own row
create policy "read own profile" on public.profiles for select using (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id);

-- Orders: user can read only their own orders (writes happen via Edge Function using service_role, bypassing RLS)
create policy "read own orders" on public.orders for select using (auth.uid() = user_id);

-- Purchases: user can read only their own purchases
create policy "read own purchases" on public.purchases for select using (auth.uid() = user_id);

-- Wishlist: user can read/insert/delete only their own rows
create policy "manage own wishlist" on public.wishlist for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Admin override: users with profiles.is_admin = true can do anything on products/categories/orders
create policy "admin manage products" on public.products for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
create policy "admin manage categories" on public.categories for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
create policy "admin read all orders" on public.orders for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
create policy "admin read all purchases" on public.purchases for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
create policy "admin delete purchases" on public.purchases for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
