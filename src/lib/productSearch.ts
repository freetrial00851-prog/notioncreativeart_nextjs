import { supabase } from './supabase'
import type { Product } from './types'

/** Typo-tolerant product search via `search_products` (pg_trgm). Exact/substring
 *  matches rank above fuzzy matches. Falls back to ilike if the RPC is unavailable. */
export async function searchProducts(query: string, limit = 50): Promise<Product[]> {
  const q = query.trim()
  if (!q) return []

  try {
    const { data, error } = await supabase.rpc('search_products', {
      search_query: q,
      result_limit: limit,
    })

    if (!error && data) return data as Product[]

    if (error) {
      console.warn('search_products RPC failed, falling back to ilike:', error.message)
    }
  } catch (err) {
    console.warn('search_products RPC threw, falling back to ilike:', err)
  }

  const { data: fallback } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
    .limit(limit)

  return (fallback as Product[]) ?? []
}
