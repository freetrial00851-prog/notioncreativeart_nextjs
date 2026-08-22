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

delete from public.purchases a
using public.purchases b
where a.user_id = b.user_id
  and a.product_id = b.product_id
  and a.purchase_date > b.purchase_date;

alter table public.purchases add constraint purchases_user_id_product_id_key unique (user_id, product_id);
