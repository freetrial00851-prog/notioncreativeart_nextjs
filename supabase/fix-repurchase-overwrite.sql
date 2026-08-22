-- Run this in Supabase SQL Editor
-- Fixes: buying the same pattern a second time overwrote the first purchase's
-- order reference instead of creating a second, separate order entry.

alter table public.purchases drop constraint if exists purchases_user_id_product_id_key;
alter table public.purchases add constraint purchases_order_id_product_id_key unique (order_id, product_id);
