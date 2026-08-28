-- Account deletion: retain orders/purchases for financial records; remove personal data.
-- Run in Supabase SQL Editor (project anlsellghialszuuvipw).
--
-- Live constraint audit (before this migration):
--   profiles.id              → auth.users  ON DELETE CASCADE
--   orders.user_id           → auth.users  ON DELETE NO ACTION  (nullable)
--   purchases.user_id        → auth.users  ON DELETE NO ACTION  (NOT NULL)
--   wishlist.user_id         → auth.users  ON DELETE NO ACTION
--   cart_items.user_id       → auth.users  ON DELETE NO ACTION
--   cart_abandoned_reminders → auth.users  ON DELETE CASCADE
--
-- After migration:
--   orders/purchases.user_id → SET NULL (rows kept; login no longer ties to them)
--   wishlist/cart_items      → CASCADE (ephemeral shopper data removed)
--   profiles                 → still CASCADE via auth.users delete

alter table public.purchases alter column user_id drop not null;

alter table public.orders drop constraint if exists orders_user_id_fkey;
alter table public.orders add constraint orders_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

alter table public.purchases drop constraint if exists purchases_user_id_fkey;
alter table public.purchases add constraint purchases_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

alter table public.wishlist drop constraint if exists wishlist_user_id_fkey;
alter table public.wishlist add constraint wishlist_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.cart_items drop constraint if exists cart_items_user_id_fkey;
alter table public.cart_items add constraint cart_items_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;
