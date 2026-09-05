import type { SupabaseClient } from '@supabase/supabase-js'
import { getCategoriesWithProducts, type CategoryWithCount } from './categories'
import { mergeLayout } from './defaultLayout'
import { HOME_FEATURED_LIMIT, HOME_NEW_ARRIVALS_LIMIT, HOME_PRODUCT_SECTION_LIMIT } from './homeProductGrid'
import type {
  Product,
  HeroContent,
  ChapterContent,
  LayoutSection,
  TestimonialContent,
} from './types'
import { normalizeFreePatternsBanner } from './types'

/** Shared homepage catalog shape — used by SSR bootstrap and the client module cache. */
export type HomeCatalogSnapshot = {
  trending: Product[]
  newArrivals: Product[]
  bundles: Product[]
  /** Up to {@link HOME_PRODUCT_SECTION_LIMIT} free patterns for the homepage grid (when built). */
  freeProducts: Product[]
  /** First free product — fallback image when no collage IDs are configured. */
  freeProduct: Product | null
  /** Admin-selected products for the Start With Free collage (ordered, with images). */
  freePatternCollage: Product[]
  categories: CategoryWithCount[]
  chapters: ChapterContent[]
  testimonials: TestimonialContent[]
  hero: HeroContent | null
  layout: LayoutSection[] | null
  skillCounts: Record<'beginner' | 'intermediate' | 'advanced', number>
  /** Prefetch for default skill-browse tab so the first paint skips a client round-trip. */
  skillPreview: Product[]
  skillPreviewLevel: 'beginner' | 'intermediate' | 'advanced'
}

export type HomeCatalogFetchResult = {
  snapshot: HomeCatalogSnapshot
  /** Present when the featured-products query failed — trending will be []. */
  featuredError: string | null
}

/**
 * Load public homepage catalog with any Supabase client (browser or static/server).
 * Shared by SSR (`createStaticClient`) and the client cache (`fetchHomeCatalog`).
 */
export async function loadHomeCatalog(
  supabase: SupabaseClient,
  options?: { simulateFeaturedFailure?: boolean },
): Promise<HomeCatalogFetchResult> {
  const featuredP = supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(HOME_FEATURED_LIMIT)
  const newP = supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .gt('price', 0)
    .order('created_at', { ascending: false })
    .limit(HOME_NEW_ARRIVALS_LIMIT)
  const bundlesP = supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .eq('is_bundle', true)
    .order('created_at', { ascending: false })
    .limit(4)
  const freeP = supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .eq('price', 0)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(HOME_PRODUCT_SECTION_LIMIT)
  const settingsP = supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['hero', 'chapters', 'homepage_layout', 'testimonials', 'free_patterns'])
  const categoriesP = getCategoriesWithProducts(supabase)
  const skillCountPs = (['beginner', 'intermediate', 'advanced'] as const).map((level) =>
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('active', true)
      .eq('skill_level', level)
      .then(({ count }) => ({ level, count: count ?? 0 })),
  )
  const skillPreviewLevel = 'beginner' as const
  const skillPreviewP = supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .eq('skill_level', skillPreviewLevel)
    .order('created_at', { ascending: false })
    .limit(5)

  const [featuredRes, newRes, bundlesRes, freeRes, settingsRes, cats, skillPreviewRes, ...skillRows] =
    await Promise.all([
      featuredP,
      newP,
      bundlesP,
      freeP,
      settingsP,
      categoriesP,
      skillPreviewP,
      ...skillCountPs,
    ])

  let hero: HeroContent | null = null
  let chapters: ChapterContent[] = []
  let layout: LayoutSection[] | null = null
  let testimonials: TestimonialContent[] = []
  let freePatternsBanner = normalizeFreePatternsBanner(null)

  for (const row of settingsRes.data ?? []) {
    if (row.key === 'hero') hero = row.value as HeroContent
    if (row.key === 'chapters') chapters = row.value as ChapterContent[]
    if (row.key === 'homepage_layout') layout = mergeLayout(row.value as LayoutSection[])
    if (row.key === 'testimonials') {
      testimonials = (row.value as TestimonialContent[]).filter((t) => t.quote && t.name)
    }
    if (row.key === 'free_patterns') {
      freePatternsBanner = normalizeFreePatternsBanner(row.value)
    }
  }

  const skillCounts = { beginner: 0, intermediate: 0, advanced: 0 }
  for (const row of skillRows as { level: 'beginner' | 'intermediate' | 'advanced'; count: number }[]) {
    skillCounts[row.level] = row.count
  }

  const featuredError = options?.simulateFeaturedFailure
    ? 'Simulated featured failure'
    : featuredRes.error?.message ?? null

  const freeList = (freeRes.data as Product[]) ?? []
  let freePatternCollage: Product[] = []
  const collageIds = freePatternsBanner.product_ids
  if (collageIds.length > 0) {
    const { data: collageRows } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .in('id', collageIds)
    const byId = new Map(((collageRows as Product[]) ?? []).map((p) => [p.id, p]))
    freePatternCollage = collageIds
      .map((id) => byId.get(id))
      .filter((p): p is Product => !!p && Array.isArray(p.images) && p.images.length > 0)
  }
  if (freePatternCollage.length === 0 && freeList[0]?.images?.[0]) {
    freePatternCollage = [freeList[0]]
  }

  const snapshot: HomeCatalogSnapshot = {
    trending: featuredError ? [] : ((featuredRes.data as Product[]) ?? []),
    newArrivals: (newRes.data as Product[]) ?? [],
    bundles: (bundlesRes.data as Product[]) ?? [],
    freeProducts: freeList,
    freeProduct: freeList[0] ?? null,
    freePatternCollage,
    categories: cats,
    chapters,
    testimonials,
    hero,
    layout,
    skillCounts,
    skillPreview: (skillPreviewRes.data as Product[]) ?? [],
    skillPreviewLevel,
  }

  return { snapshot, featuredError }
}
