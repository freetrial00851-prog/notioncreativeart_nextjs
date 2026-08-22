-- Run this in Supabase SQL Editor

alter table public.products
  add column if not exists checkout_mode text not null default 'overlay'
  check (checkout_mode in ('overlay', 'hosted'));
