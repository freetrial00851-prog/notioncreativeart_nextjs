-- Admin → Customers: also list guest buyers (paid without an account), and a detail view for them.
-- A guest is an email in orders (user_id null) that has no account yet. As soon as that email signs up,
-- the guest row disappears and the same orders are counted on the normal account row (matched by email).
-- Safe to re-run. Functions only; no tables or data change.

drop function if exists public.admin_customers(text, text, text, int, int);

create function public.admin_customers(
  p_search text default null,
  p_segment text default 'all',
  p_sort text default 'joined',
  p_limit int default 25,
  p_offset int default 0
)
returns table (
  user_id uuid,
  email text,
  name text,
  joined timestamptz,
  last_sign_in timestamptz,
  orders bigint,
  revenue numeric,
  free_claims bigint,
  wishlist_items bigint,
  cart_items bigint,
  reviews bigint,
  newsletter boolean,
  is_guest boolean,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
#variable_conflict use_column
begin
  if not public._nca_is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  with base as (
    select u.id as user_id,
           u.email::text as email,
           nullif(btrim(coalesce(p.name, '')), '') as name,
           u.created_at as joined,
           u.last_sign_in_at as last_sign_in,
           (select count(*) from public.orders o
             where o.status <> 'refunded'
               and (o.user_id = u.id or (o.user_id is null and lower(o.customer_email) = lower(u.email)))) as orders,
           (select coalesce(sum(o.amount), 0) from public.orders o
             where o.status <> 'refunded'
               and (o.user_id = u.id or (o.user_id is null and lower(o.customer_email) = lower(u.email)))) as revenue,
           (select count(*) from public.purchases pu where pu.user_id = u.id and pu.order_id is null) as free_claims,
           (select count(*) from public.wishlist w where w.user_id = u.id) as wishlist_items,
           (select count(*) from public.cart_items c where c.user_id = u.id) as cart_items,
           (select count(*) from public.reviews r where r.user_id = u.id) as reviews,
           exists (select 1 from public.newsletter_subscribers n where lower(n.email) = lower(u.email)) as newsletter,
           false as is_guest
    from auth.users u
    left join public.profiles p on p.id = u.id

    union all

    -- guests: paid orders whose email has no account (yet)
    select null::uuid,
           g.email,
           null::text,
           g.joined,
           null::timestamptz,
           g.orders,
           g.revenue,
           0::bigint,
           0::bigint,
           0::bigint,
           0::bigint,
           exists (select 1 from public.newsletter_subscribers n where lower(n.email) = g.email),
           true
    from (
      select lower(o.customer_email) as email,
             min(o.created_at) as joined,
             count(*)::bigint as orders,
             coalesce(sum(o.amount), 0) as revenue
      from public.orders o
      where o.status <> 'refunded'
        and o.user_id is null
        and o.customer_email is not null
        and o.customer_email <> 'unknown@paddle.invalid'
        and not exists (select 1 from auth.users u where lower(u.email) = lower(o.customer_email))
      group by lower(o.customer_email)
    ) g
  ),
  filtered as (
    select b.* from base b
    where (p_search is null or p_search = ''
           or b.email ilike '%' || p_search || '%'
           or coalesce(b.name, '') ilike '%' || p_search || '%')
      and case p_segment
            when 'buyers'     then b.orders > 0
            when 'free_only'  then b.free_claims > 0 and b.orders = 0
            when 'wishlisters' then b.wishlist_items > 0 and b.orders = 0
            when 'cart'       then b.cart_items > 0
            when 'idle'       then b.orders = 0 and b.free_claims = 0 and b.wishlist_items = 0 and b.cart_items = 0
            else true
          end
  )
  select f.user_id, f.email, f.name, f.joined, f.last_sign_in, f.orders, f.revenue,
         f.free_claims, f.wishlist_items, f.cart_items, f.reviews, f.newsletter, f.is_guest,
         count(*) over () as total_count
  from filtered f
  order by
    case when p_sort = 'revenue'   then f.revenue end desc nulls last,
    case when p_sort = 'orders'    then f.orders end desc nulls last,
    case when p_sort = 'last_seen' then f.last_sign_in end desc nulls last,
    f.joined desc
  limit greatest(least(p_limit, 200), 1)
  offset greatest(p_offset, 0);
end
$$;
revoke all on function public.admin_customers(text, text, text, int, int) from public, anon;
grant execute on function public.admin_customers(text, text, text, int, int) to authenticated;

-- One guest (by email): their orders and newsletter status.
create or replace function public.admin_guest_detail(p_email text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v text := lower(btrim(coalesce(p_email, '')));
begin
  if not public._nca_is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v = '' then
    return null;
  end if;

  return jsonb_build_object(
    'guest', true,
    'profile', jsonb_build_object(
      'email', v,
      'created_at', (select min(o.created_at) from public.orders o where lower(o.customer_email) = v)
    ),
    'newsletter', exists (select 1 from public.newsletter_subscribers n where lower(n.email) = v),
    'orders', coalesce((
      select jsonb_agg(x order by x.created_at desc) from (
        select ord.id, ord.display_order_number, ord.lemon_order_id, ord.provider, ord.environment,
               ord.amount, ord.currency, ord.status, ord.created_at,
               (select coalesce(jsonb_agg(jsonb_build_object('id', pr.id, 'title', pr.title, 'slug', pr.slug)), '[]'::jsonb)
                  from public.products pr where pr.id = any (ord.product_ids)) as items
        from public.orders ord
        where ord.user_id is null and lower(ord.customer_email) = v
      ) x), '[]'::jsonb)
  );
end
$$;
revoke all on function public.admin_guest_detail(text) from public, anon;
grant execute on function public.admin_guest_detail(text) to authenticated;
