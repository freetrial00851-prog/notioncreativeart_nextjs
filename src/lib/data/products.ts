import { createStaticClient } from '@/lib/supabase/static'
import type { Product } from '@/lib/types'

/**
 * Fetches a single active product by slug.
 * Uses the anon static client (no cookies) so pattern pages can be statically
 * rendered / on-demand generated without DYNAMIC_SERVER_USAGE errors.
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle()
  return data as Product | null
}

/** Fetches all active product slugs — build-time safe, no cookies required. */
export async function getAllProductSlugs(): Promise<string[]> {
  const supabase = createStaticClient()
  const { data } = await supabase.from('products').select('slug').eq('active', true)
  return (data ?? []).map((p) => p.slug)
}

/** Fetches all categories — build-time safe for sitemap generation. */
export async function getAllCategories() {
  const supabase = createStaticClient()
  const { data } = await supabase.from('categories').select('slug').order('sort_order')
  return data ?? []
}

/** Category by slug — for shop SSR titles / metadata. */
export async function getCategoryBySlug(
  slug: string,
): Promise<{ id: string; name: string; slug: string } | null> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('slug', slug)
    .maybeSingle()
  return data as { id: string; name: string; slug: string } | null
}

/** Category name + slug for breadcrumb UI / BreadcrumbList JSON-LD. */
export async function getCategoryById(
  id: string,
): Promise<{ name: string; slug: string } | null> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('categories')
    .select('name, slug')
    .eq('id', id)
    .maybeSingle()
  return data as { name: string; slug: string } | null
}
