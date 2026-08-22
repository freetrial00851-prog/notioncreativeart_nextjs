-- Run this in Supabase SQL Editor

alter table public.products add column if not exists meta_title text;
alter table public.products add column if not exists meta_description text;
