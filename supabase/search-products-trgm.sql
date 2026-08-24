-- Typo-tolerant product search via trigram similarity (pg_trgm).
-- Applied remotely via Supabase migration `enable_pg_trgm_product_search`.

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

CREATE INDEX IF NOT EXISTS products_title_trgm_idx
  ON public.products USING gin (title extensions.gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.search_products(
  search_query text,
  result_limit int DEFAULT 50
)
RETURNS SETOF public.products
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  SELECT p.*
  FROM public.products p
  WHERE p.active = true
    AND length(trim(search_query)) > 0
    AND (
      p.title ILIKE '%' || search_query || '%'
      OR coalesce(p.description, '') ILIKE '%' || search_query || '%'
      OR extensions.similarity(lower(p.title), lower(search_query)) > 0.3
      OR extensions.word_similarity(lower(search_query), lower(p.title)) > 0.4
    )
  ORDER BY
    CASE
      WHEN lower(p.title) = lower(search_query) THEN 0
      WHEN p.title ILIKE search_query || '%' THEN 1
      WHEN p.title ILIKE '%' || search_query || '%' THEN 2
      ELSE 3
    END ASC,
    GREATEST(
      extensions.similarity(lower(p.title), lower(search_query)),
      extensions.word_similarity(lower(search_query), lower(p.title))
    ) DESC,
    p.created_at DESC
  LIMIT GREATEST(1, LEAST(result_limit, 100));
$$;

GRANT EXECUTE ON FUNCTION public.search_products(text, int) TO anon, authenticated, service_role;
