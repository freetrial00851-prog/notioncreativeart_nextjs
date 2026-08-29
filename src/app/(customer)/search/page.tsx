import { Suspense } from 'react'
import { buildMetadata } from '@/lib/seo'
import { Search } from '@/views/Search'
import { SearchSkeleton } from '@/components/Skeleton'

export const metadata = buildMetadata({
  title: 'Search Patterns',
  description: 'Search crochet PDF patterns by name, category, or skill level at Notion Creative Art.',
  path: '/search',
})

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <Search />
    </Suspense>
  )
}
