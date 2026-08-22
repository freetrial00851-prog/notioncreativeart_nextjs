import { Suspense } from 'react'
import { buildMetadata, SEO_KEYWORDS } from '@/lib/seo'
import { Search } from '@/views/Search'

export const metadata = buildMetadata({
  title: 'Search Patterns',
  description: 'Search crochet PDF patterns by name, category, or skill level at Notion Creative Art.',
  path: '/search',
  keywords: [...SEO_KEYWORDS, 'search crochet patterns'],
})

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-[1400px] mx-auto px-8 py-32 text-center text-ink-soft text-sm">Loading…</div>}>
      <Search />
    </Suspense>
  )
}
