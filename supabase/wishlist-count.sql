-- Run this in Supabase SQL Editor

alter table public.products add column if not exists wishlist_count integer not null default 0;

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

-- Backfill existing counts from current wishlist rows
update public.products p
set wishlist_count = (select count(*) from public.wishlist w where w.product_id = p.id);
