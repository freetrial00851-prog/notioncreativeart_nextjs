-- Run manually in Supabase SQL Editor.
-- Adds editable homepage SEO + site-wide OG image settings (site_settings key: seo).
-- Safe to re-run: ON CONFLICT DO NOTHING.

insert into public.site_settings (key, value) values
('seo', '{
  "homepage_meta_title": "Crochet Patterns & Instant PDF Downloads | Notion Creative Art",
  "homepage_meta_description": "Shop amigurumi, wearables, home decor, and free crochet patterns as instant PDF downloads. Beginner-friendly designs from a small studio that tests every pattern.",
  "og_image": ""
}')
on conflict (key) do nothing;
