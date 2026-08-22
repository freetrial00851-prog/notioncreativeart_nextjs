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
