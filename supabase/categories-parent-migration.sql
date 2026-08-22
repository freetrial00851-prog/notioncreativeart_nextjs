-- Adds parent/subcategory support to categories, and organizes the existing
-- 38 flat categories into 10 main categories with real subcategories under
-- them. Safe to run more than once.

alter table public.categories add column if not exists parent_id uuid references public.categories(id) on delete set null;

-- 3 new main categories (Amigurumi, Wearables, Bags & Totes, Home Decor,
-- Baby & Kids, Seasonal, Bundles already exist as top-level rows).
insert into public.categories (name, slug, sort_order)
select 'Accessories', 'accessories', 5
where not exists (select 1 from public.categories where slug = 'accessories');

insert into public.categories (name, slug, sort_order)
select 'Kitchen & Storage', 'kitchen-storage', 6
where not exists (select 1 from public.categories where slug = 'kitchen-storage');

insert into public.categories (name, slug, sort_order)
select 'Holiday', 'holiday', 9
where not exists (select 1 from public.categories where slug = 'holiday');

-- Assign every subcategory to its main category, matched by slug.
update public.categories set parent_id = (select id from public.categories where slug = 'amigurumi')
where slug in ('wild-animals', 'pet-animals', 'fantasy-mythical-creatures', 'cartoon-kawaii-characters', 'miniature-amigurumi');

update public.categories set parent_id = (select id from public.categories where slug = 'wearables')
where slug in ('tops-outerwear', 'bottoms', 'dresses-jumpsuits');

update public.categories set parent_id = (select id from public.categories where slug = 'accessories')
where slug in ('head-accessories', 'neck-shoulder', 'hand-arm', 'footwear');

update public.categories set parent_id = (select id from public.categories where slug = 'bags-totes')
where slug in ('everyday-bags', 'specialty-bags');

update public.categories set parent_id = (select id from public.categories where slug = 'home-decor')
where slug in ('wall-art-wall-hangings', 'cushions-pillows', 'blankets-throws', 'rugs-mats');

update public.categories set parent_id = (select id from public.categories where slug = 'kitchen-storage')
where slug in ('table-kitchen', 'plant-storage');

update public.categories set parent_id = (select id from public.categories where slug = 'baby-kids')
where slug in ('baby-mobile-patterns', 'nursery-decor-sets', 'growth-chart-patterns', 'sensory-teething-toys', 'play-mat-patterns', 'kids-baby-wearables', 'lovey-security-blanket-combos');

update public.categories set parent_id = (select id from public.categories where slug = 'seasonal')
where slug in ('summer', 'autumn');

update public.categories set parent_id = (select id from public.categories where slug = 'holiday')
where slug in ('ramadan-eid', 'diwali');

-- Bundles stays top-level with no subcategories — nothing to assign.
