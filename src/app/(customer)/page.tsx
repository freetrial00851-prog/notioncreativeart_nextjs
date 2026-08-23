import { buildMetadata, SEO_KEYWORDS } from '@/lib/seo'
import { Home } from '@/views/Home'
import { createStaticClient } from '@/lib/supabase/static'
import type { HeroContent } from '@/lib/types'

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

/** Prefetch hero so the collage can paint on first load (no gray pulse box on hard refresh). */
async function getInitialHero(): Promise<HeroContent | null> {
  try {
    const supabase = createStaticClient()
    const { data } = await supabase.from('site_settings').select('value').eq('key', 'hero').maybeSingle()
    return (data?.value as HeroContent) ?? null
  } catch {
    return null
  }
}

/** Homepage — server-prefetched hero + client interactive sections. */
export default async function HomePage() {
  const initialHero = await getInitialHero()
  return <Home initialHero={initialHero} />
}
