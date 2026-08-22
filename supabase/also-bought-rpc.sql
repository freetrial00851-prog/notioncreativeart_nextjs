-- Run this in Supabase SQL Editor
--
-- "Customers Also Bought" needs to look across ALL orders (not just the
-- visitor's own) to find products frequently bought alongside this one —
-- but the "read own orders" RLS policy means a regular customer's browser
-- session can only ever see their own orders. Querying orders.product_ids
-- directly from the client would silently return nothing for everyone
-- except admins.
--
-- This function runs with elevated privilege (security definer) to see
-- every order, but only ever returns a plain array of product ids — no
-- customer names, emails, amounts, or order ids are exposed. Same pattern
-- as product_slug_ever_existed.

create or replace function public.get_also_bought(target_product_id uuid, result_limit int default 8)
returns uuid[]
language sql
security definer
set search_path = public
as $$
  select coalesce(array_agg(product_id order by cnt desc), array[]::uuid[])
  from (
    select pid as product_id, count(*) as cnt
    from public.orders, unnest(product_ids) as pid
    where target_product_id = any(product_ids)
      and pid != target_product_id
    group by pid
    order by cnt desc
    limit result_limit
  ) t
$$;

grant execute on function public.get_also_bought(uuid, int) to anon, authenticated;

-- Same problem, same fix, for the "X+ makers have downloaded this" trust
-- badge: "read own purchases" RLS means a regular customer's browser can
-- only ever count their own purchase of a product (0 or 1) — never the real
-- total across everyone. This returns just a count, nothing else.

create or replace function public.get_purchase_count(target_product_id uuid)
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int from public.purchases where product_id = target_product_id
$$;

grant execute on function public.get_purchase_count(uuid) to anon, authenticated;

