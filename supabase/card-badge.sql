-- Optional listing badge (SALE / NEW / FEATURED). Default: none.
alter table public.products
  add column if not exists card_badge text
  check (card_badge is null or card_badge in ('sale', 'new', 'featured'));

comment on column public.products.card_badge is
  'Optional listing card badge. Null = no badge. Values: sale, new, featured.';
