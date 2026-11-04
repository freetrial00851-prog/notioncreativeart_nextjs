-- Alt text for product photos: one string per image, same order as products.images.
-- Additive and nullable: the site falls back to "<title>, photo N of M" while a row has no alts.
alter table public.products add column if not exists image_alts jsonb;
