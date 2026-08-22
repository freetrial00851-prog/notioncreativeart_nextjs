-- Run this in Supabase SQL Editor

create table public.cart_items (
  user_id uuid not null references auth.users(id),
  product_id uuid not null references public.products(id),
  added_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table public.cart_items enable row level security;

create policy "manage own cart" on public.cart_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
