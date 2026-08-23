import { buildMetadata, SEO_KEYWORDS } from '@/lib/seo'
import { Home } from '@/views/Home'
import { createStaticClient } from '@/lib/supabase/static'
import { mergeLayout } from '@/lib/defaultLayout'
import type { HeroContent, LayoutSection } from '@/lib/types'

/** Keep homepage SSR fresh enough that admin section toggles don't flash after save. */
export const revalidate = 60

export const metadata = buildMetadata({
  title: 'Notion Creative Art',
  description:
    'Considered crochet patterns, delivered as instant PDF downloads. Shop amigurumi, wearables, home decor, beginner-friendly designs, and free crochet patterns from a small studio that tests every design twice.',
  path: '/',
  keywords: [
    ...SEO_KEYWORDS,
    'crochet patterns online shop',
    'buy crochet patterns online',
    'crochet amigurumi patterns PDF',
  ],
})

/** Prefetch hero + layout so first paint matches saved visibility and section order. */
async function getHomepageBootstrap(): Promise<{
  initialHero: HeroContent | null
  initialLayout: LayoutSection[]
}> {
  try {
    const supabase = createStaticClient()
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['hero', 'homepage_layout'])

    let initialHero: HeroContent | null = null
    let initialLayout: LayoutSection[] | null = null
    for (const row of data ?? []) {
      if (row.key === 'hero') initialHero = row.value as HeroContent
      if (row.key === 'homepage_layout') initialLayout = row.value as LayoutSection[]
    }
    return {
      initialHero,
      initialLayout: mergeLayout(initialLayout ?? []),
    }
  } catch {
    return { initialHero: null, initialLayout: mergeLayout([]) }
  }
}

/** Homepage — server-prefetched hero + layout; client handles interactive sections. */
export default async function HomePage() {
  const { initialHero, initialLayout } = await getHomepageBootstrap()
  return <Home initialHero={initialHero} initialLayout={initialLayout} />
}
