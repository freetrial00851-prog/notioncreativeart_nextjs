-- Bundle fields used by admin product form / homepage Bundles section.
-- Missing from the initial Next.js DB setup — product insert failed silently
-- without them, which blocked Save & Continue and PDF upload (needs product id).

alter table public.products
  add column if not exists is_bundle boolean not null default false;

alter table public.products
  add column if not exists bundle_includes text[] not null default '{}';

-- Draft products often have no Lemon ID yet (filled on Pricing step).
alter table public.products
  alter column lemon_variant_id set default '';

-- Backfill any nulls if the column was ever nullable mid-migration
update public.products set lemon_variant_id = '' where lemon_variant_id is null;
