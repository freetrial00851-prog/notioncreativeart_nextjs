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
