-- Product reviews & ratings (Phase 1)
-- Run manually in Supabase SQL editor after reviewing.

-- ─── Table ───────────────────────────────────────────────────────────────────

create table if not exists public.reviews (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.products(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  reviewer_name   text not null,
  reviewer_email  text,
  rating          smallint not null check (rating between 1 and 5),
  body            text not null check (char_length(body) between 10 and 2000),
  is_verified     boolean not null default false,
  purchase_id     uuid references public.purchases(id) on delete set null,
  status          text not null default 'pending'
                  check (status in ('pending', 'approved', 'rejected')),
  created_at      timestamptz not null default now(),
  moderated_at    timestamptz,
  moderated_by    uuid references auth.users(id),
  unique (user_id, product_id)
);

create index if not exists reviews_product_status_idx on public.reviews (product_id, status);
create index if not exists reviews_status_created_idx on public.reviews (status, created_at desc);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.reviews enable row level security;

drop policy if exists "public read approved reviews" on public.reviews;
create policy "public read approved reviews"
  on public.reviews for select
  using (status = 'approved');

drop policy if exists "users read own reviews" on public.reviews;
create policy "users read own reviews"
  on public.reviews for select
  using (auth.uid() = user_id);

drop policy if exists "admin manage reviews" on public.reviews;
create policy "admin manage reviews"
  on public.reviews for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- ─── RPC: submit review (validates ownership) ────────────────────────────────

create or replace function public.submit_review(
  p_product_id uuid,
  p_rating smallint,
  p_body text,
  p_reviewer_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_purchase_id uuid;
  v_is_verified boolean := false;
  v_email text;
  v_review_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_rating < 1 or p_rating > 5 then
    raise exception 'Rating must be between 1 and 5';
  end if;

  if char_length(trim(p_body)) < 10 or char_length(p_body) > 2000 then
    raise exception 'Review must be between 10 and 2000 characters';
  end if;

  if char_length(trim(p_reviewer_name)) < 1 or char_length(p_reviewer_name) > 80 then
    raise exception 'Name is required';
  end if;

  select
    p.id,
    (p.order_id is not null and o.status = 'paid')
  into v_purchase_id, v_is_verified
  from public.purchases p
  left join public.orders o on o.id = p.order_id
  where p.user_id = v_user_id
    and p.product_id = p_product_id
  limit 1;

  if v_purchase_id is null then
    raise exception 'You must own this pattern to leave a review';
  end if;

  select email into v_email from auth.users where id = v_user_id;

  insert into public.reviews (
    product_id, user_id, reviewer_name, reviewer_email,
    rating, body, is_verified, purchase_id, status
  ) values (
    p_product_id, v_user_id, trim(p_reviewer_name), v_email,
    p_rating, trim(p_body), v_is_verified, v_purchase_id, 'pending'
  )
  returning id into v_review_id;

  return v_review_id;
exception
  when unique_violation then
    raise exception 'You have already reviewed this pattern';
end;
$$;

revoke all on function public.submit_review(uuid, smallint, text, text) from public;
grant execute on function public.submit_review(uuid, smallint, text, text) to authenticated;

-- ─── RPC: aggregate stats for approved reviews ───────────────────────────────

create or replace function public.get_product_review_stats(p_product_id uuid)
returns table (average_rating numeric, review_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(round(avg(rating)::numeric, 1), 0),
    count(*)::bigint
  from public.reviews
  where product_id = p_product_id
    and status = 'approved';
$$;

revoke all on function public.get_product_review_stats(uuid) from public;
grant execute on function public.get_product_review_stats(uuid) to anon, authenticated;

-- ─── RPC: pending count for admin nav badge ──────────────────────────────────

create or replace function public.get_pending_review_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
    then (select count(*)::bigint from public.reviews where status = 'pending')
    else 0::bigint
  end;
$$;

revoke all on function public.get_pending_review_count() from public;
grant execute on function public.get_pending_review_count() to authenticated;
