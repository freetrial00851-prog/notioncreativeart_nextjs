-- AUTO-GENERATED continue script — run ONLY if full-setup.sql failed partway through
-- PREREQUISITE: public.purchases must already exist (schema.sql section completed).
-- If you see "relation public.purchases does not exist", run full-setup.sql instead.

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'purchases'
  ) then
    raise exception 'public.purchases does not exist. Run supabase/full-setup.sql first — not this continue script.';
  end if;
end $$;


-- ═══ purchases-unique-constraint-fix.sql ═══
-- schema.sql defines `unique (user_id, product_id)` on purchases, but this
-- constraint is missing from the live database (confirmed via error 42P10:
-- "there is no unique or exclusion constraint matching the ON CONFLICT
-- specification"). Adding it now for real duplicate-prevention at the
-- database level.
--
-- A few duplicate (user_id, product_id) rows already exist from earlier
-- failed free-download attempts (before this was fixed) — clean those up
-- first, keeping the earliest row per pair, or the constraint can't be
-- created.
-- Skipped entirely when public.purchases does not exist yet (run full-setup.sql first).

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'purchases'
  ) then
    raise notice 'Skipping purchases-unique-constraint-fix: public.purchases does not exist yet.';
    return;
  end if;

  delete from public.purchases a
  using public.purchases b
  where a.user_id = b.user_id
    and a.product_id = b.product_id
    and a.purchase_date > b.purchase_date;

  if not exists (
    select 1 from pg_constraint where conname = 'purchases_user_id_product_id_key'
  ) then
    alter table public.purchases
      add constraint purchases_user_id_product_id_key unique (user_id, product_id);
  end if;
end $$;


-- ═══ purchases-insert-policy-free-only.sql ═══
-- purchases only ever had a SELECT policy ("read own purchases") — there was
-- never an INSERT policy at all, so the free-pattern direct-download flow's
-- client-side upsert into purchases was silently blocked by RLS from the
-- start (the upsert call doesn't check for errors, so this went unnoticed).
-- The old, overly-broad storage policy masked the symptom by letting
-- signed URLs succeed regardless; the new ownership-checking storage policy
-- correctly exposed it, since no real purchases row ever existed.
--
-- This lets a signed-in user insert a purchases row for themselves — but
-- ONLY when the target product is actually free (price = 0), so this can't
-- be used to "claim" a paid pattern without going through checkout. Paid
-- purchases are still created exclusively by the lemon-webhook Edge
-- Function, which uses the service-role key and bypasses RLS entirely —
-- this policy has no effect on that path.

drop policy if exists "users can claim free patterns" on public.purchases;

create policy "users can claim free patterns"
on public.purchases for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.products
    where products.id = purchases.product_id
    and products.price = 0
  )
);


-- ═══ CRITICAL-fix-profile-privilege-escalation.sql ═══
-- CRITICAL: the original "update own profile" policy only checked that a
-- user was updating their OWN row (auth.uid() = id) — it never restricted
-- WHICH columns they could change. Any signed-up customer could call
-- `supabase.from('profiles').update({ is_admin: true }).eq('id', <self>)`
-- from the browser and grant themselves full admin access.
--
-- This replaces it with a WITH CHECK clause that blocks is_admin from
-- being changed through this self-service path — it must stay exactly
-- what it already was. Every other profile field (name, billing address,
-- phone, etc.) is still freely self-editable as before. is_admin can still
-- be changed by you directly via Supabase Dashboard → Table Editor (which
-- uses a privileged connection that bypasses RLS entirely).

drop policy if exists "update own profile" on public.profiles;

create policy "update own profile" on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid())
  );


-- ═══ patterns-bucket-read-policy-v2-secure.sql ═══
-- The previous policy (patterns-bucket-read-policy.sql) let ANY signed-in
-- user generate a signed URL for ANY file in the 'patterns' bucket — the
-- app's own UI only showed download links to people who'd actually bought
-- (or claimed, for free items) the pattern, but that check lived only in
-- the browser, not in the database. Anyone could open dev tools and call
-- createSignedUrl() directly with a product id they never purchased.
--
-- This replaces it with a real ownership check: a signed URL for
-- "<product_id>.pdf" only succeeds if the requesting user has a matching
-- row in purchases, or is an admin (needed for the admin "Test download"
-- button, which checks arbitrary products regardless of purchase history).

drop policy if exists "authenticated users can read patterns" on storage.objects;
drop policy if exists "read own purchased patterns or admin" on storage.objects;

create policy "read own purchased patterns or admin"
on storage.objects for select
to authenticated
using (
  bucket_id = 'patterns'
  and (
    exists (
      select 1 from public.purchases
      where purchases.user_id = auth.uid()
      and purchases.product_id = (regexp_replace(storage.objects.name, '\.pdf$', ''))::uuid
    )
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  )
);


-- ═══ fix-null-images.sql ═══
-- Run this in Supabase SQL Editor
-- Fixes: products.images became NULL for some rows during the earlier
-- schema changes (text[] -> jsonb -> text[] rollback), which crashed the
-- admin product list (and potentially customer-facing pages) wherever code
-- assumed images was always at least an empty array.

update public.products set images = '{}' where images is null;
alter table public.products alter column images set not null;


-- ═══ fix-google-profile-names.sql ═══
-- Run this in Supabase SQL Editor.
-- Fixes: Google sign-ins were getting a blank profile name, because Google
-- populates raw_user_meta_data with given_name/family_name/full_name/name,
-- not the first_name/last_name keys our email-signup flow uses.

create or replace function public.handle_new_user()
returns trigger as $$
declare
  full_name text;
begin
  full_name := new.raw_user_meta_data->>'full_name';
  if full_name is null then
    full_name := new.raw_user_meta_data->>'name';
  end if;

  insert into public.profiles (id, first_name, last_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'first_name',
      new.raw_user_meta_data->>'given_name',
      split_part(full_name, ' ', 1)
    ),
    coalesce(
      new.raw_user_meta_data->>'last_name',
      new.raw_user_meta_data->>'family_name',
      nullif(substring(full_name from position(' ' in full_name) + 1), '')
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  );
  return new;
end;
$$ language plpgsql security definer;

-- One-time backfill for accounts (like your own test account) created before this fix,
-- pulling from their Google metadata that's already stored in auth.users:
update public.profiles p
set
  first_name = coalesce(p.first_name, coalesce(u.raw_user_meta_data->>'given_name', split_part(u.raw_user_meta_data->>'full_name', ' ', 1), split_part(u.raw_user_meta_data->>'name', ' ', 1))),
  last_name = coalesce(p.last_name, coalesce(u.raw_user_meta_data->>'family_name', nullif(substring(u.raw_user_meta_data->>'full_name' from position(' ' in u.raw_user_meta_data->>'full_name') + 1), '')))
from auth.users u
where p.id = u.id and (p.first_name is null or p.last_name is null);


-- ═══ fix-repurchase-overwrite.sql ═══
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


-- ═══ cascade-product-delete.sql ═══
-- Run this in Supabase SQL Editor
-- Fixes: deleting an old product failed silently/with an error, because
-- wishlist/cart_items/purchases rows referencing it blocked the delete
-- (a foreign-key protection, working as intended — this migration removes
-- that protection on purpose since he's in test phase and wants full deletes
-- to actually work everywhere).

do $$
declare
  con record;
begin
  -- wishlist.product_id -> products.id
  for con in
    select conname from pg_constraint
    where conrelid = 'public.wishlist'::regclass
      and confrelid = 'public.products'::regclass
      and contype = 'f'
  loop
    execute format('alter table public.wishlist drop constraint %I', con.conname);
  end loop;
  alter table public.wishlist
    add constraint wishlist_product_id_fkey
    foreign key (product_id) references public.products(id) on delete cascade;

  -- cart_items.product_id -> products.id
  for con in
    select conname from pg_constraint
    where conrelid = 'public.cart_items'::regclass
      and confrelid = 'public.products'::regclass
      and contype = 'f'
  loop
    execute format('alter table public.cart_items drop constraint %I', con.conname);
  end loop;
  alter table public.cart_items
    add constraint cart_items_product_id_fkey
    foreign key (product_id) references public.products(id) on delete cascade;

  -- purchases.product_id -> products.id
  for con in
    select conname from pg_constraint
    where conrelid = 'public.purchases'::regclass
      and confrelid = 'public.products'::regclass
      and contype = 'f'
  loop
    execute format('alter table public.purchases drop constraint %I', con.conname);
  end loop;
  alter table public.purchases
    add constraint purchases_product_id_fkey
    foreign key (product_id) references public.products(id) on delete cascade;
end $$;


-- ═══ rate-limit-table.sql ═══
-- Generic rate-limit event log — Edge Functions insert a row per attempt and
-- check how many rows exist for a given key within a time window before
-- allowing an action. No RLS policies needed here: only Edge Functions
-- (using the service-role key) ever touch this table, never the browser
-- directly.

create table if not exists public.rate_limit_events (
  id bigserial primary key,
  key text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_events_key_created_at_idx
  on public.rate_limit_events (key, created_at);

-- Housekeeping: old rows are cheap to accumulate but no longer useful once
-- their window has passed. Safe to run manually any time; nothing depends
-- on rows older than a day for any current rate limit window.
delete from public.rate_limit_events where created_at < now() - interval '1 day';


-- ═══ newsletter-close-direct-insert.sql ═══
-- Newsletter signups now go through the 'subscribe-newsletter' Edge
-- Function, which enforces real server-side rate limiting before inserting.
-- The old "public can subscribe" policy let ANY client insert directly via
-- the Supabase REST API, completely bypassing that rate limit — a spam
-- script could just skip the Edge Function and hit the table directly.
--
-- This removes that open policy. The Edge Function still works because it
-- uses the service-role key, which bypasses RLS entirely. Admin read access
-- is untouched.

drop policy if exists "public can subscribe" on public.newsletter_subscribers;


-- ═══ catchup-migration.sql ═══
-- Run this in Supabase SQL Editor — safe to run even if some of these
-- already exist (everything uses IF NOT EXISTS / safe defaults).
-- This is a catch-up migration covering everything added across this
-- project's session, in case any individual file was missed.

-- Fixes the current "can't add/edit/delete products" crash:
update public.products set images = '{}' where images is null;
alter table public.products alter column images set not null;

alter table public.products add column if not exists sold_out boolean not null default false;
alter table public.products add column if not exists checkout_mode text not null default 'overlay';
alter table public.products add column if not exists materials text;
alter table public.products add column if not exists lemon_numeric_variant_id text;
alter table public.products add column if not exists wishlist_count integer not null default 0;

alter table public.profiles add column if not exists billing_country text;
alter table public.profiles add column if not exists billing_zip text;

-- Re-create the wishlist_count trigger (safe to re-run)
create or replace function public.update_wishlist_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.products set wishlist_count = wishlist_count + 1 where id = new.product_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.products set wishlist_count = greatest(wishlist_count - 1, 0) where id = old.product_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_wishlist_change on public.wishlist;
create trigger on_wishlist_change
  after insert or delete on public.wishlist
  for each row execute procedure public.update_wishlist_count();

update public.products p
set wishlist_count = (select count(*) from public.wishlist w where w.product_id = p.id)
where p.wishlist_count = 0;


-- ═══ grants-api-access.sql ═══
-- Ensure Supabase REST API (anon/authenticated) can read public tables after manual SQL setup.
grant usage on schema public to anon, authenticated, service_role;
grant select on all tables in schema public to anon, authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant select on tables to anon, authenticated;
alter default privileges in schema public grant all on tables to service_role;

notify pgrst, 'reload schema';


-- ═══ seed-initial-data.sql ═══
-- Initial seed data for notioncreativeart_nextjs (NEW independent database)
-- Safe to re-run — uses ON CONFLICT / IF NOT EXISTS patterns.

-- Announcements bar
insert into public.site_settings (key, value) values
  ('announcements', '{"messages":["FREE PATTERN WITH EVERY FIRST ORDER — CODE FIRSTSTITCH"]}'::jsonb)
on conflict (key) do update set value = excluded.value;

-- Hero section
insert into public.site_settings (key, value) values
  ('hero', '{
    "eyebrow": "CROCHET PATTERNS FOR EVERY MAKER",
    "title": "Beautiful Patterns. Made for You.",
    "images": ["/hero-bunny.jpg"],
    "cta_text": "Shop Patterns",
    "cta_link": "/shop/new",
    "secondary_cta_text": "Explore Free Patterns",
    "secondary_cta_link": "/shop?price=free"
  }'::jsonb)
on conflict (key) do update set value = excluded.value;

-- Homepage layout (section order)
insert into public.site_settings (key, value) values
  ('homepage_layout', '[
    {"id":"hero","label":"Hero","visible":true},
    {"id":"trust","label":"Trust Bar","visible":true},
    {"id":"categories","label":"Categories","visible":true},
    {"id":"chapters","label":"Skill Chapters","visible":true},
    {"id":"trending","label":"Featured","visible":true},
    {"id":"new_arrivals","label":"New Arrivals","visible":true},
    {"id":"skill_browse","label":"Skill Browse","visible":true},
    {"id":"free_patterns","label":"Free Patterns","visible":true},
    {"id":"bundles","label":"Bundles","visible":true},
    {"id":"why_us","label":"Why Us","visible":true},
    {"id":"testimonials","label":"Testimonials","visible":true},
    {"id":"newsletter","label":"Newsletter","visible":true}
  ]'::jsonb)
on conflict (key) do update set value = excluded.value;

-- Skill level chapters
insert into public.site_settings (key, value) values
  ('chapters', '[
    {"level":"beginner","label":"CHAPTER 01","title":"Beginner","copy":"Single crochet, half-double, and foundational shaping.","image":"","link":"/shop?level=beginner"},
    {"level":"intermediate","label":"CHAPTER 02","title":"Intermediate","copy":"Colourwork, garment shaping, and multi-piece construction.","image":"","link":"/shop?level=intermediate"},
    {"level":"advanced","label":"CHAPTER 03","title":"Advanced","copy":"Fine-gauge wearables and technical construction.","image":"","link":"/shop?level=advanced"}
  ]'::jsonb)
on conflict (key) do update set value = excluded.value;

-- Extra categories (parent + subcategories for mega menu)
insert into public.categories (name, slug, sort_order, parent_id) values
  ('Baby & Kids', 'baby-kids', 4, null),
  ('Seasonal & Holiday', 'seasonal', 5, null),
  ('Accessories', 'accessories', 6, null),
  ('Tools & Guides', 'tools-guides', 7, null)
on conflict (slug) do nothing;

-- Subcategories under Amigurumi
insert into public.categories (name, slug, sort_order, parent_id)
select 'Wild Animals', 'wild-animals', 1, id from public.categories where slug = 'amigurumi'
on conflict (slug) do nothing;

insert into public.categories (name, slug, sort_order, parent_id)
select 'Pet Animals', 'pet-animals', 2, id from public.categories where slug = 'amigurumi'
on conflict (slug) do nothing;

-- Make first user admin (replace email after signup):
-- update public.profiles set is_admin = true where id = (select id from auth.users where email = 'your@email.com');

