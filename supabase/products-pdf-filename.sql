-- Original uploaded PDF filename (storage object remains {product_id}.pdf).
alter table public.products add column if not exists pdf_filename text;
