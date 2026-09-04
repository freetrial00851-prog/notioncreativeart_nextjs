-- Paid purchase counts for Shop/Search "Best Selling" sort.
-- Run manually in Supabase SQL editor.
--
-- Counts ONLY paid purchases (order_id IS NOT NULL). Free-claim rows
-- (order_id null) are excluded so free patterns don't outrank paid sales.
-- This intentionally differs from get_purchase_count / PDP "X+ makers
-- downloaded", which counts all purchases rows.

create or replace function public.get_purchase_counts_batch(
  p_product_ids uuid[],
  p_paid_only boolean default true
)
returns table (product_id uuid, purchase_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.product_id,
    count(*)::bigint as purchase_count
  from public.purchases p
  where p.product_id = any(p_product_ids)
    and (
      not p_paid_only
      or p.order_id is not null
    )
  group by p.product_id;
$$;

revoke all on function public.get_purchase_counts_batch(uuid[], boolean) from public;
grant execute on function public.get_purchase_counts_batch(uuid[], boolean) to anon, authenticated;
