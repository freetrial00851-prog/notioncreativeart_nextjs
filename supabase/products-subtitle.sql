-- Product page short blurb under the title (distinct from description).
alter table public.products add column if not exists subtitle text;

comment on column public.products.subtitle is 'Short product page blurb under the title (~100-150 chars); distinct from description.';
