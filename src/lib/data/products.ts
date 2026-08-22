import { createClient } from '@/lib/supabase/server'
import { createStaticClient } from '@/lib/supabase/static'
import type { Product } from '@/lib/types'

/** Fetches a single active product by slug — used for SSR metadata and preloading. */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient()
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
