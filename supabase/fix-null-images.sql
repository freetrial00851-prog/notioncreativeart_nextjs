-- Run this in Supabase SQL Editor
-- Fixes: products.images became NULL for some rows during the earlier
-- schema changes (text[] -> jsonb -> text[] rollback), which crashed the
-- admin product list (and potentially customer-facing pages) wherever code
-- assumed images was always at least an empty array.

update public.products set images = '{}' where images is null;
alter table public.products alter column images set not null;
