-- Run this in Supabase SQL Editor
-- Fixes: buying the same pattern a second time overwrote the first purchase's
-- order reference instead of creating a second, separate order entry.

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'purchases'
  ) then
    raise notice 'Skipping fix-repurchase-overwrite: public.purchases does not exist yet.';
    return;
  end if;

  alter table public.purchases drop constraint if exists purchases_user_id_product_id_key;

  if not exists (
    select 1 from pg_constraint where conname = 'purchases_order_id_product_id_key'
  ) then
    alter table public.purchases
      add constraint purchases_order_id_product_id_key unique (order_id, product_id);
  end if;
end $$;
