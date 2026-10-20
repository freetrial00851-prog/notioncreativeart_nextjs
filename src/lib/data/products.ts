import { createStaticClient } from '@/lib/supabase/static'
import type { Product, Category } from '@/lib/types'
import { filterProductsByListingParams } from '@/lib/listingFilters'

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

/**
 * First page of products for /shop and /shop/[category], rendered into the server HTML so
 * crawlers (and slow connections) see real product links and images instead of "Loading…".
 * Mirrors the client query in views/Shop.tsx for the unfiltered, newest-first state.
 */
export async function getShopSeed(
  categorySlug?: string,
  limit = 12,
): Promise<{ products: Product[]; categories: Category[] } | null> {
  try {
    const supabase = createStaticClient()
    const { data: cats } = await supabase.from('categories').select('*').order('sort_order')
    const categories = (cats as Category[]) ?? []
    let q = supabase.from('products').select('*').eq('active', true).is('deleted_at', null)
    if (categorySlug === 'sale') q = q.not('compare_at_price', 'is', null)
    else if (categorySlug === 'bestsellers') q = q.eq('featured', true)
    else if (categorySlug && categorySlug !== 'new') {
      const cat = categories.find((c) => c.slug === categorySlug)
      if (!cat) return null
      const subIds = cat.parent_id ? [] : categories.filter((c) => c.parent_id === cat.id).map((c) => c.id)
      q = q.in('category_id', [cat.id, ...subIds])
    }
    const { data } = await q.order('created_at', { ascending: false }).limit(limit * 4)
    let rows = (data as Product[]) ?? []
    if (categorySlug === 'sale') rows = filterProductsByListingParams(rows, { sale: true })
    return { products: rows.slice(0, limit), categories }
  } catch {
    return null
  }
}

/** Admin-written intro text for a category page (site_settings key `category_intros`, a {slug: text} map). */
export async function getCategoryIntro(slug: string): Promise<string | null> {
  try {
    const supabase = createStaticClient()
    const { data } = await supabase.from('site_settings').select('value').eq('key', 'category_intros').maybeSingle()
    const v = (data?.value ?? {}) as Record<string, unknown>
    const text = typeof v[slug] === 'string' ? (v[slug] as string).trim() : ''
    return text || null
  } catch {
    return null
  }
}
