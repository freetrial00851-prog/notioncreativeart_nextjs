-- Reverts products.images from jsonb (new pipeline format) back to text[]
-- (plain URL strings) — needed because you're rolling back to the v15 build,
-- which expects the old format. Run this in Supabase SQL Editor.

alter table public.products alter column images drop default;
alter table public.products alter column images type text[] using '{}'::text[];
alter table public.products alter column images set default '{}'::text[];
