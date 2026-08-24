import type { SupabaseClient } from '@supabase/supabase-js'
import { getSubcategoriesWithCounts, type SubcategoryWithCount } from './categories'
import type { Category, Product } from './types'

export type ShopFilters = {
  categorySlug: string | null
  level: string | null
  price: string | null
  bundle: boolean
  sale: boolean
}

export type ShopCatalogSnapshot = {
  products: Product[]
  categories: Category[]
  sidebarCategories: SubcategoryWithCount[]
  suggestions: Product[]
  filters: ShopFilters
}

export function parseShopFilters(
  categorySlug: string | null | undefined,
  searchParams: Record<string, string | string[] | undefined> | URLSearchParams,
): ShopFilters {
  const get = (key: string): string | null => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key)
    }
    const raw = searchParams[key]
    if (Array.isArray(raw)) return raw[0] ?? null
    return raw ?? null
  }

  return {
    categorySlug: categorySlug ?? null,
    level: get('level'),
    price: get('price'),
    bundle: get('bundle') === '1',
    sale: get('sale') === '1',
  }
}

export function shopFiltersKey(filters: ShopFilters): string {
  return [
    filters.categorySlug ?? '',
    filters.level ?? '',
    filters.price ?? '',
    filters.bundle ? '1' : '0',
    filters.sale ? '1' : '0',
  ].join('|')
}

/**
 * Public shop listing — shared by SSR (`createStaticClient`) and client refetch on filter change.
 */
export async function loadShopCatalog(
  supabase: SupabaseClient,
  filters: ShopFilters,
): Promise<ShopCatalogSnapshot> {
  const { data: categoriesData } = await supabase.from('categories').select('*').order('sort_order')
  const categories = (categoriesData as Category[]) ?? []

  let query = supabase.from('products').select('*').eq('active', true)
  if (filters.level) query = query.eq('skill_level', filters.level)
  if (filters.price === 'free') query = query.eq('price', 0)
  if (filters.bundle) query = query.eq('is_bundle', true)

  const categorySlug = filters.categorySlug
  if (categorySlug === 'sale') {
    query = query.not('compare_at_price', 'is', null)
  } else if (categorySlug === 'bestsellers') {
    query = query.eq('featured', true)
  } else if (categorySlug && categorySlug !== 'new') {
    const cat = categories.find((c) => c.slug === categorySlug)
    if (cat) {
      if (cat.parent_id) {
        query = query.eq('category_id', cat.id)
      } else {
        const subIds = categories.filter((c) => c.parent_id === cat.id).map((c) => c.id)
        query = query.in('category_id', [cat.id, ...subIds])
      }
    }
  }

  const { data: productsData } = await query.order('created_at', { ascending: false })
  let products = (productsData as Product[]) ?? []

  if (filters.sale) {
    products = products.filter((p) => p.price > 0 && !!p.compare_at_price && p.compare_at_price > p.price)
  }

  let sidebarCategories: SubcategoryWithCount[] = []
  const currentCategory = categories.find((c) => c.slug === categorySlug)
  if (currentCategory) {
    const parentId = currentCategory.parent_id ?? currentCategory.id
    sidebarCategories = await getSubcategoriesWithCounts(supabase, parentId)
  }

  let suggestions: Product[] = []
  if (products.length === 0) {
    const { data: suggestionData } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('wishlist_count', { ascending: false })
      .limit(4)
    suggestions = (suggestionData as Product[]) ?? []
  }

  return {
    products,
    categories,
    sidebarCategories,
    suggestions,
    filters,
  }
}
