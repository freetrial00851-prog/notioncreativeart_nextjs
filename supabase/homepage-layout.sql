-- Run this in Supabase SQL Editor

insert into public.site_settings (key, value) values
('homepage_layout', '[
  {"id": "hero", "label": "Hero Banner", "visible": true},
  {"id": "categories", "label": "Shop by Category", "visible": true},
  {"id": "chapters", "label": "Skill Level Chapters", "visible": true},
  {"id": "trending", "label": "Trending Now", "visible": true},
  {"id": "new_arrivals", "label": "New Arrivals", "visible": true}
]')
on conflict (key) do nothing;
