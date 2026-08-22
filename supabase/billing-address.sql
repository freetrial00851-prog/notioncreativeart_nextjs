-- Run this in Supabase SQL Editor

alter table public.profiles add column if not exists billing_country text;
alter table public.profiles add column if not exists billing_zip text;
