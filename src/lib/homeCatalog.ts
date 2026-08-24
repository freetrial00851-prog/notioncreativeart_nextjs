import type { SupabaseClient } from '@supabase/supabase-js'
import { getCategoriesWithProducts, type CategoryWithCount } from './categories'
import { mergeLayout } from './defaultLayout'
import type {
  Product,
  HeroContent,
  ChapterContent,
  LayoutSection,
  TestimonialContent,
} from './types'

/** Shared homepage catalog shape — used by SSR bootstrap and the client module cache. */
export type HomeCatalogSnapshot = {
  trending: Product[]
  newArrivals: Product[]
  bundles: Product[]
  freeProduct: Product | null
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
    .limit(6)
  const newP = supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(6)
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
    .limit(1)
  const settingsP = supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['hero', 'chapters', 'homepage_layout', 'testimonials'])
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

  for (const row of settingsRes.data ?? []) {
    if (row.key === 'hero') hero = row.value as HeroContent
    if (row.key === 'chapters') chapters = row.value as ChapterContent[]
    if (row.key === 'homepage_layout') layout = mergeLayout(row.value as LayoutSection[])
    if (row.key === 'testimonials') {
      testimonials = (row.value as TestimonialContent[]).filter((t) => t.quote && t.name)
    }
  }

  const skillCounts = { beginner: 0, intermediate: 0, advanced: 0 }
  for (const row of skillRows as { level: 'beginner' | 'intermediate' | 'advanced'; count: number }[]) {
    skillCounts[row.level] = row.count
  }

  const featuredError = options?.simulateFeaturedFailure
    ? 'Simulated featured failure'
    : featuredRes.error?.message ?? null

  const snapshot: HomeCatalogSnapshot = {
    trending: featuredError ? [] : ((featuredRes.data as Product[]) ?? []),
    newArrivals: (newRes.data as Product[]) ?? [],
    bundles: (bundlesRes.data as Product[]) ?? [],
    freeProduct: (freeRes.data as Product[])?.[0] ?? null,
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
