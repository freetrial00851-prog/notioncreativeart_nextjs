-- Batch review stats for shop/card grids (Phase 2)
-- Run manually in Supabase SQL editor after reviews.sql.

create or replace function public.get_product_review_stats_batch(p_product_ids uuid[])
returns table (product_id uuid, average_rating numeric, review_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.product_id,
    round(avg(r.rating)::numeric, 1),
    count(*)::bigint
  from public.reviews r
  where r.product_id = any(p_product_ids)
    and r.status = 'approved'
  group by r.product_id;
$$;

revoke all on function public.get_product_review_stats_batch(uuid[]) from public;
grant execute on function public.get_product_review_stats_batch(uuid[]) to anon, authenticated;
