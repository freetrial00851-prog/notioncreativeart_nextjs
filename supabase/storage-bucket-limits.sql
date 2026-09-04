-- Storage bucket hard limits (server-side).
-- Live sizes as of hardening: PDFs max ~0.85MB, product-images max ~0.37MB.
-- Limits leave headroom without allowing multi-hundred-MB abuse.

update storage.buckets
set
  file_size_limit = 20971520, -- 20 MiB
  allowed_mime_types = array['application/pdf']::text[]
where id = 'patterns';

update storage.buckets
set
  file_size_limit = 10485760, -- 10 MiB
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']::text[]
where id = 'product-images';
