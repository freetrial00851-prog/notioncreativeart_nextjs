-- Initial seed data for notioncreativeart_nextjs (NEW independent database)
-- Safe to re-run — uses ON CONFLICT / IF NOT EXISTS patterns.

-- Announcements bar
insert into public.site_settings (key, value) values
  ('announcements', '{"messages":["FREE PATTERN WITH EVERY FIRST ORDER — CODE FIRSTSTITCH"]}'::jsonb)
on conflict (key) do update set value = excluded.value;

-- Hero section
insert into public.site_settings (key, value) values
  ('hero', '{
    "eyebrow": "CROCHET PATTERNS FOR EVERY MAKER",
    "title": "Beautiful Patterns. Made for You.",
    "images": ["/hero-bunny.jpg"],
    "cta_text": "Shop Patterns",
    "cta_link": "/shop/new",
    "secondary_cta_text": "Explore Free Patterns",
    "secondary_cta_link": "/shop?price=free"
  }'::jsonb)
on conflict (key) do update set value = excluded.value;

-- Homepage layout (section order)
insert into public.site_settings (key, value) values
  ('homepage_layout', '[
    {"id":"hero","label":"Hero","visible":true},
    {"id":"trust","label":"Trust Bar","visible":true},
    {"id":"categories","label":"Categories","visible":true},
    {"id":"chapters","label":"Skill Chapters","visible":true},
    {"id":"trending","label":"Featured","visible":true},
    {"id":"new_arrivals","label":"New Arrivals","visible":true},
    {"id":"skill_browse","label":"Skill Browse","visible":true},
    {"id":"free_patterns","label":"Free Patterns","visible":true},
    {"id":"bundles","label":"Bundles","visible":true},
    {"id":"why_us","label":"Why Us","visible":true},
    {"id":"testimonials","label":"Testimonials","visible":true},
    {"id":"newsletter","label":"Newsletter","visible":true}
  ]'::jsonb)
on conflict (key) do update set value = excluded.value;

-- Skill level chapters
insert into public.site_settings (key, value) values
  ('chapters', '[
    {"level":"beginner","label":"CHAPTER 01","title":"Beginner","copy":"Single crochet, half-double, and foundational shaping.","image":"","link":"/shop?level=beginner"},
    {"level":"intermediate","label":"CHAPTER 02","title":"Intermediate","copy":"Colourwork, garment shaping, and multi-piece construction.","image":"","link":"/shop?level=intermediate"},
    {"level":"advanced","label":"CHAPTER 03","title":"Advanced","copy":"Fine-gauge wearables and technical construction.","image":"","link":"/shop?level=advanced"}
  ]'::jsonb)
on conflict (key) do update set value = excluded.value;

-- Extra categories (parent + subcategories for mega menu)
insert into public.categories (name, slug, sort_order, parent_id) values
  ('Baby & Kids', 'baby-kids', 4, null),
  ('Seasonal & Holiday', 'seasonal', 5, null),
  ('Accessories', 'accessories', 6, null),
  ('Tools & Guides', 'tools-guides', 7, null)
on conflict (slug) do nothing;

-- Subcategories under Amigurumi
insert into public.categories (name, slug, sort_order, parent_id)
select 'Wild Animals', 'wild-animals', 1, id from public.categories where slug = 'amigurumi'
on conflict (slug) do nothing;

insert into public.categories (name, slug, sort_order, parent_id)
select 'Pet Animals', 'pet-animals', 2, id from public.categories where slug = 'amigurumi'
on conflict (slug) do nothing;

-- Make first user admin (replace email after signup):
-- update public.profiles set is_admin = true where id = (select id from auth.users where email = 'your@email.com');
