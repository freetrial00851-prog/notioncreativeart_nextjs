-- Run this in Supabase SQL Editor
-- Adds the remaining billing-address fields on top of billing-address.sql
-- (which already added billing_country + billing_zip).

alter table public.profiles add column if not exists billing_address_line1 text;
alter table public.profiles add column if not exists billing_city text;
alter table public.profiles add column if not exists billing_state text;
