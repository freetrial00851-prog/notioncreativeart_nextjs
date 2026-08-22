-- Run this in Supabase SQL Editor

alter table public.products add column if not exists sold_out boolean not null default false;

insert into public.site_settings (key, value) values
('announcements', '{
  "messages": [
    "FREE PATTERN WITH EVERY FIRST ORDER — CODE FIRSTSTITCH",
    "NEW: BEGINNER-FRIENDLY PATTERNS EVERY WEEK",
    "INSTANT PDF DOWNLOAD — NO WAITING, NO SHIPPING",
    "PATTERNS TESTED TWICE BEFORE THEY GO LIVE"
  ]
}')
on conflict (key) do nothing;

insert into public.site_settings (key, value) values
('social', '{
  "instagram": "",
  "youtube": ""
}')
on conflict (key) do nothing;
