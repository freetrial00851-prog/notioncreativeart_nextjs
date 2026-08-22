-- Run this in Supabase SQL Editor (replaces the previous version — that one
-- failed because Postgres couldn't auto-cast the OLD default value to jsonb).
-- IMPORTANT: run this only AFTER deleting your old test product listings.

-- If you still have old products with the old string[] images format, delete them first:
-- delete from public.products;

alter table public.products alter column images drop default;
alter table public.products alter column images type jsonb using '[]'::jsonb;
alter table public.products alter column images set default '[]'::jsonb;
