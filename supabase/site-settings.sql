-- Run this in Supabase SQL Editor (after schema.sql, storage-setup.sql, seed-categories.sql)

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

create policy "public read site settings" on public.site_settings for select using (true);

create policy "admin manage site settings" on public.site_settings for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- Seed with the current hardcoded content, so nothing changes visually until you edit it in /admin
insert into public.site_settings (key, value) values
('hero', '{
  "eyebrow": "DIGITAL PDF PATTERNS",
  "title": "Considered patterns, made to last a season and beyond.",
  "images": [],
  "cta_text": "SHOP ALL PATTERNS",
  "cta_link": "/shop"
}'),
('chapters', '[
  {"level": "beginner", "label": "CHAPTER 01", "title": "Beginner", "copy": "Single crochet, half-double, and foundational shaping. Written slow, with stitch counts you can trust.", "image": "", "link": "/shop?level=beginner"},
  {"level": "intermediate", "label": "CHAPTER 02", "title": "Intermediate", "copy": "Colourwork, garment shaping, and multi-piece construction for hands that already know their hook.", "image": "", "link": "/shop?level=intermediate"},
  {"level": "advanced", "label": "CHAPTER 03", "title": "Advanced", "copy": "Fine-gauge wearables and technical construction, for a practiced hand.", "image": "", "link": "/shop?level=advanced"}
]'),
('categories', '[
  {"name": "Amigurumi", "copy": "Toys and characters, one stitch at a time", "image": "", "link": "/shop/amigurumi"},
  {"name": "Wearables", "copy": "Tops, cardigans and accessories to wear", "image": "", "link": "/shop/wearables"},
  {"name": "Home & Decor", "copy": "Blankets, cushions and pieces for the house", "image": "", "link": "/shop/home-decor"},
  {"name": "Bundles", "copy": "Several patterns, one price", "image": "", "link": "/shop/bundles"}
]');
