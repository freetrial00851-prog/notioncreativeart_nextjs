import { createStaticClient } from '@/lib/supabase/static'
import type { HeroContent, SiteSeoContent } from '@/lib/types'

export const DEFAULT_HOMEPAGE_META_TITLE =
  'Crochet Patterns & Instant PDF Downloads | Notion Creative Art'

export const DEFAULT_HOMEPAGE_META_DESCRIPTION =
  'Shop amigurumi, wearables, home decor, and free crochet patterns as instant PDF downloads. Beginner-friendly designs from a small studio that tests every pattern.'

export const DEFAULT_SITE_SEO: SiteSeoContent = {
  homepage_meta_title: DEFAULT_HOMEPAGE_META_TITLE,
  homepage_meta_description: DEFAULT_HOMEPAGE_META_DESCRIPTION,
  og_image: '',
}

export type SiteSeoContext = {
  seo: SiteSeoContent
  hero: HeroContent | null
  /** seo.og_image → hero.images[0]; never favicon. */
  siteOgImage: string | undefined
}

/** Site-wide OG fallback: custom SEO image, then hero — never favicon. */
export function resolveSiteOgImage(
  seoOgImage?: string | null,
  heroImage?: string | null,
): string | undefined {
  const fromSeo = seoOgImage?.trim()
  if (fromSeo) return fromSeo
  const fromHero = heroImage?.trim()
  if (fromHero) return fromHero
  return undefined
}

/** Loads homepage SEO fields and the resolved site-wide OG image (server / build safe). */
export async function getSiteSeoContext(): Promise<SiteSeoContext> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['seo', 'hero'])

  let seo: SiteSeoContent = { ...DEFAULT_SITE_SEO }
  let hero: HeroContent | null = null

  for (const row of data ?? []) {
    if (row.key === 'seo') {
      seo = { ...DEFAULT_SITE_SEO, ...(row.value as Partial<SiteSeoContent>) }
    }
    if (row.key === 'hero') hero = row.value as HeroContent
  }

  return {
    seo,
    hero,
    siteOgImage: resolveSiteOgImage(seo.og_image, hero?.images?.[0]),
  }
}
