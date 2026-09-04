'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { searchProducts } from '../lib/productSearch'
import type { Product } from '../lib/types'
import { ProductCard } from '../components/ProductCard'
import { useReviewStatsMapForLists } from '../lib/useReviewStatsMap'
import { EmptyState } from '../components/EmptyState'
import { ProductGridSkeleton } from '../components/Skeleton'

const PAGE_SIZE = 15

export function Search() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams?.get('q') ?? ''
  const [results, setResults] = useState<Product[]>([])
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [loading, setLoading] = useState(() => Boolean(q.trim()))
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    setPage(1)
    if (!q.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    searchProducts(q)
      .then((data) => {
        if (cancelled) return
        setResults(data)
      })
      .catch((err) => {
        console.error('Search failed:', err)
        if (!cancelled) setResults([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [q])

  useEffect(() => {
    if (loading || !q || results.length > 0) return
    supabase.from('products').select('*').eq('active', true).order('wishlist_count', { ascending: false }).limit(4)
      .then(({ data }) => setSuggestions((data as Product[]) ?? []))
  }, [loading, q, results.length])

  const pageCount = Math.ceil(results.length / PAGE_SIZE)
  const pagedResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const reviewStatsMap = useReviewStatsMapForLists([pagedResults, suggestions])
  const goToPage = (p: number) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="max-w-site w-full mx-auto px-6 md:px-16 xl:px-24 2xl:px-32 py-10 md:py-14">
      <div className="border-b border-line pb-4 mb-8 flex items-center justify-between">
        <p className="text-[11px] tracking-[0.15em] text-ink-soft">SEARCH</p>
        {q && (
          <p className="text-[11px] tracking-[0.08em] text-ink-soft">
            {loading ? 'Searching…' : `${results.length} result${results.length === 1 ? '' : 's'}`}
          </p>
        )}
      </div>

      {!loading && q && results.length === 0 && (
        <div className="mb-14">
          <EmptyState
            icon="search_off"
            title={`No patterns found for "${q}"`}
            subtitle="Try different keywords or browse our categories."
            actionLabel="Browse categories"
            actionTo="/shop"
            afterAction={(
              <button
                type="button"
                onClick={() => router.push('/search')}
                className="px-6 py-3 rounded-full border border-line text-[13px] font-semibold hover:bg-surface transition-colors"
              >
                Clear search
              </button>
            )}
          />
        </div>
      )}

      {!q && (
        <p className="text-ink-soft text-[13px]">Type above to find patterns by name or description.</p>
      )}

      {loading && q ? (
        <ProductGridSkeleton variant="search" />
      ) : results.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 lg:gap-x-8 gap-y-10 lg:gap-y-14">
            {pagedResults.map((p) => (
              <ProductCard key={p.id} product={p} reviewStats={reviewStatsMap.get(p.id)} />
            ))}
          </div>
          {pageCount > 1 && (
            <div className="flex items-center justify-center gap-2 mt-14">
              <button onClick={() => goToPage(page - 1)} disabled={page === 1} aria-label="Previous page" className="w-9 h-9 flex items-center justify-center rounded-full border border-line hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors">‹</button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  aria-current={p === page ? 'page' : undefined}
                  className={`w-9 h-9 flex items-center justify-center rounded-full text-[13px] transition-colors ${p === page ? 'text-white' : 'border border-line hover:bg-surface'}`}
                  style={p === page ? { background: 'var(--color-accent)' } : undefined}
                >
                  {p}
                </button>
              ))}
              <button onClick={() => goToPage(page + 1)} disabled={page === pageCount} aria-label="Next page" className="w-9 h-9 flex items-center justify-center rounded-full border border-line hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors">›</button>
            </div>
          )}
        </>
      ) : suggestions.length > 0 && (
        <div>
          <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-6">YOU MAY LIKE</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 lg:gap-x-8 gap-y-10">
            {suggestions.map((p) => (
              <ProductCard key={p.id} product={p} reviewStats={reviewStatsMap.get(p.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
