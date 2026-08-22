-- Run this ONCE in Supabase SQL Editor to migrate your existing hero image
-- from the old single-image format to the new multi-image (carousel) format.

update public.site_settings
set value = (value - 'image') || jsonb_build_object(
  'images',
  case when coalesce(value->>'image', '') <> '' then jsonb_build_array(value->>'image') else '[]'::jsonb end
)
where key = 'hero';
