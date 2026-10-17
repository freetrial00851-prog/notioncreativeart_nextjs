-- ============================================================================
-- Admin analytics (DRAFT) — events table + admin-only reporting functions
-- ----------------------------------------------------------------------------
-- NOT applied automatically. Review, then run once in the Supabase SQL editor.
-- Safe to re-run (everything is `if not exists` / `create or replace`).
--
-- Why this exists
--   The admin panel needs to answer "which customer wishlisted/carted/bought
--   what", "how many visitors", "where did they come from", "what did they
--   search" — but row-level security (correctly) stops even an admin's browser
--   from reading other users' wishlist, cart, profiles or auth.users.
--   So every report below is a SECURITY DEFINER function that first checks
--   `profiles.is_admin` for the caller and raises otherwise. Nothing here
--   widens what a normal visitor or customer can read.
--
-- Privacy
--   * `events` holds ids and numbers only (no emails, no IPs, no free text
--     other than a truncated search term).
--   * session_id / referrer / utm / user_id are only sent by the storefront when
--     the visitor accepted cookies (see src/lib/track.ts). Without consent an
--     event is anonymous: name + path (+ product) only.
--   * Insert goes through the `track-event` edge function (service role,
--     origin check, bot filter, rate limit). Browsers cannot insert directly.
-- ============================================================================

-- ---------- helper: is the caller an admin? ---------------------------------
create or replace function public._nca_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false)
$$;

revoke all on function public._nca_is_admin() from public, anon;
grant execute on function public._nca_is_admin() to authenticated, service_role;

-- ---------- events -----------------------------------------------------------
create table if not exists public.events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  event_name  text not null check (event_name in (
    'page_view', 'view_item', 'add_to_cart', 'remove_from_cart',
    'add_to_wishlist', 'remove_from_wishlist', 'begin_checkout', 'purchase',
    'free_download', 'download', 'search', 'sign_up', 'login',
    'newsletter_subscribe', 'chat_open', 'review_submit', 'share'
  )),
  user_id     uuid references auth.users (id) on delete set null,
  session_id  text check (session_id is null or char_length(session_id) <= 64),
  path        text check (path is null or (char_length(path) <= 512 and path like '/%')),
  product_id  uuid references public.products (id) on delete set null,
  props       jsonb not null default '{}'::jsonb check (pg_column_size(props) < 2048),
  referrer    text check (referrer is null or char_length(referrer) <= 255),
  utm_source  text check (utm_source is null or char_length(utm_source) <= 100),
  utm_medium  text check (utm_medium is null or char_length(utm_medium) <= 100),
  utm_campaign text check (utm_campaign is null or char_length(utm_campaign) <= 150),
  device      text check (device is null or device in ('mobile', 'tablet', 'desktop')),
  country     text check (country is null or char_length(country) = 2)
);

create index if not exists events_created_at_idx   on public.events (created_at desc);
create index if not exists events_name_created_idx on public.events (event_name, created_at desc);
create index if not exists events_product_idx      on public.events (product_id, event_name) where product_id is not null;
create index if not exists events_user_idx         on public.events (user_id, created_at desc) where user_id is not null;
create index if not exists events_session_idx      on public.events (session_id, created_at) where session_id is not null;

alter table public.events enable row level security;

drop policy if exists "admin read events" on public.events;
create policy "admin read events" on public.events
  for select to authenticated
  using (public._nca_is_admin());

revoke all on public.events from anon, authenticated;
grant select on public.events to authenticated;
grant all on public.events to service_role;

-- Keep raw events for 13 months (call from a scheduled job / run manually).
create or replace function public.admin_prune_events(p_keep interval default interval '13 months')
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  n bigint;
begin
  if not public._nca_is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  delete from public.events where created_at < now() - p_keep;
  get diagnostics n = row_count;
  return n;
end
$$;
revoke all on function public.admin_prune_events(interval) from public, anon;
grant execute on function public.admin_prune_events(interval) to authenticated;

-- ---------- health -----------------------------------------------------------
create or replace function public.admin_health()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not public._nca_is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'version', 1,
    'events_total', (select count(*) from public.events),
    'events_24h', (select count(*) from public.events where created_at > now() - interval '24 hours'),
    'last_event_at', (select max(created_at) from public.events),
    'page_views_total', (select count(*) from public.page_views),
    'users_total', (select count(*) from auth.users)
  );
end
$$;
revoke all on function public.admin_health() from public, anon;
grant execute on function public.admin_health() to authenticated;

-- ---------- daily series -----------------------------------------------------
create or replace function public.admin_daily(p_from timestamptz, p_to timestamptz, p_tz text default 'UTC')
returns table (
  day date,
  views bigint,
  visitors bigint,
  signups bigint,
  orders bigint,
  revenue numeric,
  refunds bigint,
  refund_value numeric,
  free_claims bigint,
  wishlist_adds bigint,
  cart_adds bigint,
  newsletter bigint
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
  with days as (
    select generate_series((p_from at time zone p_tz)::date, ((p_to - interval '1 second') at time zone p_tz)::date, interval '1 day')::date as d
  ),
  pv as (
    select (pvw.created_at at time zone p_tz)::date as d, count(*) as c
    from public.page_views pvw
    where pvw.created_at >= p_from and pvw.created_at < p_to
    group by 1
  ),
  vis as (
    select (e.created_at at time zone p_tz)::date as d, count(distinct e.session_id) as c
    from public.events e
    where e.created_at >= p_from and e.created_at < p_to and e.session_id is not null
    group by 1
  ),
  su as (
    select (u.created_at at time zone p_tz)::date as d, count(*) as c
    from auth.users u
    where u.created_at >= p_from and u.created_at < p_to
    group by 1
  ),
  ord as (
    select (o.created_at at time zone p_tz)::date as d,
           count(*) filter (where o.status <> 'refunded') as c,
           coalesce(sum(o.amount) filter (where o.status <> 'refunded'), 0) as v,
           count(*) filter (where o.status = 'refunded') as rc,
           coalesce(sum(o.amount) filter (where o.status = 'refunded'), 0) as rv
    from public.orders o
    where o.created_at >= p_from and o.created_at < p_to
    group by 1
  ),
  fc as (
    select (pu.purchase_date at time zone p_tz)::date as d, count(*) as c
    from public.purchases pu
    where pu.order_id is null and pu.purchase_date >= p_from and pu.purchase_date < p_to
    group by 1
  ),
  wl as (
    select (w.created_at at time zone p_tz)::date as d, count(*) as c
    from public.wishlist w
    where w.created_at >= p_from and w.created_at < p_to
    group by 1
  ),
  ca as (
    select (e.created_at at time zone p_tz)::date as d, count(*) as c
    from public.events e
    where e.event_name = 'add_to_cart' and e.created_at >= p_from and e.created_at < p_to
    group by 1
  ),
  nl as (
    select (n.subscribed_at at time zone p_tz)::date as d, count(*) as c
    from public.newsletter_subscribers n
    where n.subscribed_at >= p_from and n.subscribed_at < p_to
    group by 1
  )
  select days.d,
         coalesce(pv.c, 0),
         coalesce(vis.c, 0),
         coalesce(su.c, 0),
         coalesce(ord.c, 0),
         coalesce(ord.v, 0),
         coalesce(ord.rc, 0),
         coalesce(ord.rv, 0),
         coalesce(fc.c, 0),
         coalesce(wl.c, 0),
         coalesce(ca.c, 0),
         coalesce(nl.c, 0)
  from days
  left join pv  on pv.d  = days.d
  left join vis on vis.d = days.d
  left join su  on su.d  = days.d
  left join ord on ord.d = days.d
  left join fc  on fc.d  = days.d
  left join wl  on wl.d  = days.d
  left join ca  on ca.d  = days.d
  left join nl  on nl.d  = days.d
  order by days.d;
end
$$;
revoke all on function public.admin_daily(timestamptz, timestamptz, text) from public, anon;
grant execute on function public.admin_daily(timestamptz, timestamptz, text) to authenticated;

-- ---------- funnel (distinct sessions per stage) -----------------------------
create or replace function public.admin_funnel(p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public._nca_is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return (
    select jsonb_build_object(
      'sessions',       count(distinct e.session_id),
      'view_item',      count(distinct e.session_id) filter (where e.event_name = 'view_item'),
      'add_to_cart',    count(distinct e.session_id) filter (where e.event_name = 'add_to_cart'),
      'begin_checkout', count(distinct e.session_id) filter (where e.event_name = 'begin_checkout'),
      'orders',         (select count(*) from public.orders o where o.status <> 'refunded' and o.created_at >= p_from and o.created_at < p_to)
    )
    from public.events e
    where e.created_at >= p_from and e.created_at < p_to and e.session_id is not null
  );
end
$$;
revoke all on function public.admin_funnel(timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_funnel(timestamptz, timestamptz) to authenticated;

-- ---------- traffic ----------------------------------------------------------
create or replace function public.admin_traffic(p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public._nca_is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'top_pages', coalesce((
      select jsonb_agg(t) from (
        select pv.path, count(*) as views
        from public.page_views pv
        where pv.created_at >= p_from and pv.created_at < p_to
        group by pv.path order by count(*) desc limit 25
      ) t), '[]'::jsonb),
    'sources', coalesce((
      select jsonb_agg(t) from (
        select coalesce(nullif(e.utm_source, ''), nullif(e.referrer, ''), 'direct') as source,
               count(distinct e.session_id) as sessions,
               count(*) filter (where e.event_name = 'add_to_cart') as cart_adds,
               count(*) filter (where e.event_name = 'begin_checkout') as checkouts
        from public.events e
        where e.created_at >= p_from and e.created_at < p_to and e.session_id is not null
        group by 1 order by 2 desc limit 20
      ) t), '[]'::jsonb),
    'campaigns', coalesce((
      select jsonb_agg(t) from (
        select e.utm_campaign as campaign, coalesce(e.utm_source, '') as source, count(distinct e.session_id) as sessions
        from public.events e
        where e.created_at >= p_from and e.created_at < p_to and e.utm_campaign is not null
        group by 1, 2 order by 3 desc limit 20
      ) t), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_agg(t) from (
        select coalesce(e.device, 'unknown') as device, count(distinct e.session_id) as sessions
        from public.events e
        where e.created_at >= p_from and e.created_at < p_to and e.session_id is not null
        group by 1 order by 2 desc
      ) t), '[]'::jsonb),
    'countries', coalesce((
      select jsonb_agg(t) from (
        select coalesce(e.country, '??') as country, count(distinct e.session_id) as sessions
        from public.events e
        where e.created_at >= p_from and e.created_at < p_to and e.session_id is not null
        group by 1 order by 2 desc limit 20
      ) t), '[]'::jsonb),
    'landing_pages', coalesce((
      select jsonb_agg(t) from (
        select l.path, count(*) as sessions from (
          select distinct on (e.session_id) e.session_id, e.path
          from public.events e
          where e.created_at >= p_from and e.created_at < p_to and e.session_id is not null and e.event_name = 'page_view'
          order by e.session_id, e.created_at
        ) l
        group by l.path order by 2 desc limit 20
      ) t), '[]'::jsonb)
  );
end
$$;
revoke all on function public.admin_traffic(timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_traffic(timestamptz, timestamptz) to authenticated;

-- ---------- search terms -----------------------------------------------------
create or replace function public.admin_search_terms(p_from timestamptz, p_to timestamptz)
returns table (term text, searches bigint, zero_results bigint, avg_results numeric)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public._nca_is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
  select lower(btrim(e.props ->> 'q')) as term,
         count(*) as searches,
         count(*) filter (where coalesce((e.props ->> 'results')::int, 0) = 0) as zero_results,
         round(avg(coalesce((e.props ->> 'results')::int, 0)), 1) as avg_results
  from public.events e
  where e.event_name = 'search'
    and e.created_at >= p_from and e.created_at < p_to
    and coalesce(btrim(e.props ->> 'q'), '') <> ''
  group by 1
  order by 2 desc
  limit 200;
end
$$;
revoke all on function public.admin_search_terms(timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_search_terms(timestamptz, timestamptz) to authenticated;

-- ---------- live -------------------------------------------------------------
create or replace function public.admin_live(p_minutes int default 5)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not public._nca_is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'active_visitors', (
      select count(distinct e.session_id) from public.events e
      where e.session_id is not null and e.created_at > now() - make_interval(mins => greatest(p_minutes, 1))
    ),
    'recent', coalesce((
      select jsonb_agg(t) from (
        select e.created_at as at, e.event_name as event, e.path,
               (select pr.title from public.products pr where pr.id = e.product_id) as product,
               (select coalesce(nullif(btrim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), ''), split_part(u.email, '@', 1))
                  from auth.users u left join public.profiles p on p.id = u.id where u.id = e.user_id) as customer,
               e.user_id
        from public.events e
        where e.event_name <> 'page_view'
        order by e.created_at desc
        limit 25
      ) t), '[]'::jsonb)
  );
end
$$;
revoke all on function public.admin_live(int) from public, anon;
grant execute on function public.admin_live(int) to authenticated;

-- ---------- customers --------------------------------------------------------
create or replace function public.admin_customers(
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
           nullif(btrim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), '') as name,
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
           exists (select 1 from public.newsletter_subscribers n where lower(n.email) = lower(u.email)) as newsletter
    from auth.users u
    left join public.profiles p on p.id = u.id
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
         f.free_claims, f.wishlist_items, f.cart_items, f.reviews, f.newsletter,
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

-- ---------- one customer (360) ------------------------------------------------
create or replace function public.admin_customer_detail(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_email text;
begin
  if not public._nca_is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select u.email::text into v_email from auth.users u where u.id = p_user_id;
  if v_email is null then
    return null;
  end if;

  return jsonb_build_object(
    'profile', (
      select to_jsonb(x) from (
        select u.id, u.email::text as email, u.created_at, u.last_sign_in_at,
               p.first_name, p.last_name, p.billing_country, p.billing_state, p.billing_zip
        from auth.users u left join public.profiles p on p.id = u.id
        where u.id = p_user_id
      ) x),
    'newsletter', exists (select 1 from public.newsletter_subscribers n where lower(n.email) = lower(v_email)),
    'orders', coalesce((
      select jsonb_agg(o order by o.created_at desc) from (
        select ord.id, ord.lemon_order_id, ord.amount, ord.currency, ord.status, ord.created_at,
               (select coalesce(jsonb_agg(jsonb_build_object('id', pr.id, 'title', pr.title, 'slug', pr.slug)), '[]'::jsonb)
                  from public.products pr where pr.id = any (ord.product_ids)) as items
        from public.orders ord
        where ord.user_id = p_user_id or (ord.user_id is null and lower(ord.customer_email) = lower(v_email))
      ) o), '[]'::jsonb),
    'wishlist', coalesce((
      select jsonb_agg(w order by w.added_at desc) from (
        select pr.id as product_id, pr.title, pr.slug, pr.price, wl.created_at as added_at,
               exists (select 1 from public.purchases pu where pu.user_id = p_user_id and pu.product_id = pr.id) as bought
        from public.wishlist wl join public.products pr on pr.id = wl.product_id
        where wl.user_id = p_user_id
      ) w), '[]'::jsonb),
    'cart', coalesce((
      select jsonb_agg(c order by c.added_at desc) from (
        select pr.id as product_id, pr.title, pr.slug, pr.price, ci.added_at, ci.updated_at
        from public.cart_items ci join public.products pr on pr.id = ci.product_id
        where ci.user_id = p_user_id
      ) c), '[]'::jsonb),
    'downloads', coalesce((
      select jsonb_agg(d order by d.at desc) from (
        select pr.id as product_id, pr.title, pr.slug, pu.purchase_date as at,
               case when pu.order_id is null then 'free' else 'paid' end as kind
        from public.purchases pu join public.products pr on pr.id = pu.product_id
        where pu.user_id = p_user_id
      ) d), '[]'::jsonb),
    'reviews', coalesce((
      select jsonb_agg(r order by r.created_at desc) from (
        select rv.id, rv.product_id, pr.title, rv.rating, rv.status, rv.body, rv.created_at
        from public.reviews rv join public.products pr on pr.id = rv.product_id
        where rv.user_id = p_user_id
      ) r), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(ev order by ev.at desc) from (
        select e.created_at as at, e.event_name as event, e.path,
               (select pr.title from public.products pr where pr.id = e.product_id) as product
        from public.events e
        where e.user_id = p_user_id
        order by e.created_at desc
        limit 100
      ) ev), '[]'::jsonb)
  );
end
$$;
revoke all on function public.admin_customer_detail(uuid) from public, anon;
grant execute on function public.admin_customer_detail(uuid) to authenticated;

-- ---------- wishlists (who saved what) ---------------------------------------
create or replace function public.admin_wishlists(p_only_unbought boolean default false, p_limit int default 50, p_offset int default 0)
returns table (
  user_id uuid,
  email text,
  name text,
  product_id uuid,
  title text,
  slug text,
  price numeric,
  added_at timestamptz,
  bought boolean,
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
  with rows_ as (
    select wl.user_id,
           u.email::text as email,
           nullif(btrim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), '') as name,
           pr.id as product_id, pr.title, pr.slug, pr.price,
           wl.created_at as added_at,
           exists (select 1 from public.purchases pu where pu.user_id = wl.user_id and pu.product_id = wl.product_id) as bought
    from public.wishlist wl
    join public.products pr on pr.id = wl.product_id
    join auth.users u on u.id = wl.user_id
    left join public.profiles p on p.id = wl.user_id
  )
  select r.user_id, r.email, r.name, r.product_id, r.title, r.slug, r.price, r.added_at, r.bought,
         count(*) over () as total_count
  from rows_ r
  where (not p_only_unbought) or r.bought = false
  order by r.added_at desc
  limit greatest(least(p_limit, 200), 1)
  offset greatest(p_offset, 0);
end
$$;
revoke all on function public.admin_wishlists(boolean, int, int) from public, anon;
grant execute on function public.admin_wishlists(boolean, int, int) to authenticated;

-- ---------- carts (open + abandoned) -----------------------------------------
create or replace function public.admin_carts(p_abandon_hours int default 24)
returns table (
  user_id uuid,
  email text,
  name text,
  items jsonb,
  item_count bigint,
  value numeric,
  updated_at timestamptz,
  abandoned boolean
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
  select c.user_id,
         u.email::text,
         nullif(btrim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), ''),
         jsonb_agg(jsonb_build_object('product_id', pr.id, 'title', pr.title, 'slug', pr.slug, 'price', pr.price) order by c.added_at),
         count(*),
         coalesce(sum(pr.price), 0),
         max(c.updated_at),
         max(c.updated_at) < now() - make_interval(hours => greatest(p_abandon_hours, 1))
  from public.cart_items c
  join public.products pr on pr.id = c.product_id
  join auth.users u on u.id = c.user_id
  left join public.profiles p on p.id = c.user_id
  group by c.user_id, u.email, p.first_name, p.last_name
  order by max(c.updated_at) desc;
end
$$;
revoke all on function public.admin_carts(int) from public, anon;
grant execute on function public.admin_carts(int) to authenticated;

-- ---------- product performance ----------------------------------------------
create or replace function public.admin_top_products(p_from timestamptz, p_to timestamptz)
returns table (
  product_id uuid,
  title text,
  slug text,
  price numeric,
  views bigint,
  wishlist_adds bigint,
  wishlist_total bigint,
  cart_adds bigint,
  orders bigint,
  free_claims bigint,
  revenue numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if not public._nca_is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
  with sold as (
    select pid as product_id,
           count(*) as orders,
           sum(o.amount / greatest(array_length(o.product_ids, 1), 1)) as revenue
    from public.orders o, unnest(o.product_ids) as pid
    where o.status <> 'refunded' and o.created_at >= p_from and o.created_at < p_to
    group by pid
  ),
  pv as (
    select substring(v.path from '^/pattern/([^/?#]+)') as slug, count(*) as c
    from public.page_views v
    where v.created_at >= p_from and v.created_at < p_to and v.path like '/pattern/%'
    group by 1
  ),
  wl as (
    select w.product_id, count(*) as c from public.wishlist w
    where w.created_at >= p_from and w.created_at < p_to group by 1
  ),
  ca as (
    select e.product_id, count(*) as c from public.events e
    where e.event_name = 'add_to_cart' and e.product_id is not null
      and e.created_at >= p_from and e.created_at < p_to group by 1
  ),
  fc as (
    select pu.product_id, count(*) as c from public.purchases pu
    where pu.order_id is null and pu.purchase_date >= p_from and pu.purchase_date < p_to group by 1
  )
  select pr.id, pr.title, pr.slug, pr.price,
         coalesce(pv.c, 0),
         coalesce(wl.c, 0),
         coalesce(pr.wishlist_count, 0)::bigint,
         coalesce(ca.c, 0),
         coalesce(sold.orders, 0),
         coalesce(fc.c, 0),
         coalesce(sold.revenue, 0)
  from public.products pr
  left join sold on sold.product_id = pr.id
  left join pv on pv.slug = pr.slug
  left join wl on wl.product_id = pr.id
  left join ca on ca.product_id = pr.id
  left join fc on fc.product_id = pr.id
  where pr.deleted_at is null
  order by coalesce(sold.revenue, 0) desc, coalesce(pv.c, 0) desc;
end
$$;
revoke all on function public.admin_top_products(timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_top_products(timestamptz, timestamptz) to authenticated;
