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
