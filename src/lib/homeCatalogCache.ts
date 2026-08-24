import { supabase } from './supabase'
import { getCategoriesWithProducts, type CategoryWithCount } from './categories'
import { mergeLayout } from './defaultLayout'
import type {
  Product,
  HeroContent,
  ChapterContent,
  LayoutSection,
  TestimonialContent,
} from './types'

/** Warm TTL — back-nav within this window skips network and paints instantly. */
const TTL_MS = 2.5 * 60 * 1000

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
}

export type HomeCatalogFetchResult = {
  snapshot: HomeCatalogSnapshot
  /** Present when the featured-products query failed — trending will be []. */
  featuredError: string | null
}

type CacheEntry = { data: HomeCatalogSnapshot; at: number }

let entry: CacheEntry | null = null
let inflight: Promise<HomeCatalogFetchResult> | null = null

export function getHomeCatalogCache(): HomeCatalogSnapshot | null {
  if (!entry) return null
  if (Date.now() - entry.at > TTL_MS) {
    entry = null
    return null
  }
  return entry.data
}

export function setHomeCatalogCache(data: HomeCatalogSnapshot) {
  entry = { data, at: Date.now() }
}

export function clearHomeCatalogCache() {
  entry = null
}

function shouldSimulateFeaturedFailure(): boolean {
  if (typeof window === 'undefined') return false
  if (process.env.NODE_ENV === 'production') return false
  return new URLSearchParams(window.location.search).get('failFeatured') === '1'
}

async function loadHomeCatalog(): Promise<HomeCatalogFetchResult> {
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
  const categoriesP = getCategoriesWithProducts()
  const skillCountPs = (['beginner', 'intermediate', 'advanced'] as const).map((level) =>
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('active', true)
      .eq('skill_level', level)
      .then(({ count }) => ({ level, count: count ?? 0 })),
  )

  const [featuredRes, newRes, bundlesRes, freeRes, settingsRes, cats, ...skillRows] = await Promise.all([
    featuredP,
    newP,
    bundlesP,
    freeP,
    settingsP,
    categoriesP,
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

  const simulateFail = shouldSimulateFeaturedFailure()
  const featuredError = simulateFail
    ? 'Simulated featured failure'
    : featuredRes.error?.message ?? null

  const snapshot: HomeCatalogSnapshot = {
    // On featured query failure, do not treat null data as a legitimate empty list.
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
  }

  return { snapshot, featuredError }
}

/**
 * Deduped fetch. Successful featured queries (including a real empty list) are
 * cached; featured query failures are never written to the module cache.
 */
export function fetchHomeCatalog(): Promise<HomeCatalogFetchResult> {
  if (inflight) return inflight
  inflight = loadHomeCatalog()
    .then((result) => {
      if (!result.featuredError) {
        setHomeCatalogCache(result.snapshot)
      }
      return result
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}
