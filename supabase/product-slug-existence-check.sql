-- Run this in Supabase SQL Editor
-- Lets the product page tell "this URL never existed" apart from "this
-- pattern existed but was deactivated/deleted" — without exposing any
-- product data to non-admin visitors (RLS still fully applies to the
-- products table itself; this only returns a boolean).

create or replace function public.product_slug_ever_existed(check_slug text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(select 1 from public.products where slug = check_slug);
$$;

grant execute on function public.product_slug_ever_existed(text) to anon, authenticated;
