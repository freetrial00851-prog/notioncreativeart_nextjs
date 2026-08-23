'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import type { Product } from '../lib/types'
import { ProductCard } from '../components/ProductCard'
import { MaterialIcon } from '../components/MaterialIcon'
import { ProductGridSkeleton } from '../components/Skeleton'

const PAGE_SIZE = 15

export function Search() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams?.get('q') ?? ''
  const [results, setResults] = useState<Product[]>([])
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
    if (!q.trim()) return setResults([])
    setLoading(true)
    supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
      .then(({ data }) => {
        setResults((data as Product[]) ?? [])
        setLoading(false)
      })
  }, [q])

  useEffect(() => {
    if (loading || !q || results.length > 0) return
    supabase.from('products').select('*').eq('active', true).order('wishlist_count', { ascending: false }).limit(4)
      .then(({ data }) => setSuggestions((data as Product[]) ?? []))
  }, [loading, q, results.length])

  const pageCount = Math.ceil(results.length / PAGE_SIZE)
  const pagedResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const goToPage = (p: number) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="max-w-site w-full mx-auto px-6 md:px-16 py-10 md:py-14">
      <div className="border-b border-line pb-4 mb-8 flex items-center justify-between">
        <p className="text-[11px] tracking-[0.15em] text-ink-soft">SEARCH</p>
        {q && (
          <p className="text-[11px] tracking-[0.08em] text-ink-soft">
            {loading ? 'Searching…' : `${results.length} result${results.length === 1 ? '' : 's'}`}
          </p>
        )}
      </div>

      {!loading && q && results.length === 0 && (
        <div className="text-center py-10 mb-14">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--color-surface)' }}>
            <MaterialIcon name="search_off" size={36} color="var(--color-ink-soft)" />
          </div>
          <h2 className="font-display font-semibold text-2xl mb-2">No patterns found for "{q}"</h2>
          <p className="text-ink-soft text-[14px] mb-8">Try different keywords or browse our categories.</p>
          <div className="flex gap-4 justify-center text-[12px] tracking-[0.12em]">
            <Link href="/shop" className="px-7 py-3.5 bg-ink text-canvas hover:opacity-85 rounded-lg">BROWSE CATEGORIES</Link>
            <button onClick={() => router.push('/search')} className="px-7 py-3.5 border border-ink hover:bg-surface rounded-lg">CLEAR SEARCH</button>
          </div>
        </div>
      )}

      {!q && (
        <p className="text-ink-soft text-sm">Type above to find patterns by name or description.</p>
      )}

      {loading && q ? (
        <ProductGridSkeleton count={6} />
      ) : results.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-6 lg:gap-x-8 gap-y-10 lg:gap-y-14">
            {pagedResults.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          {pageCount > 1 && (
            <div className="flex items-center justify-center gap-2 mt-14">
              <button onClick={() => goToPage(page - 1)} disabled={page === 1} aria-label="Previous page" className="w-9 h-9 flex items-center justify-center rounded-lg border border-line hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors">‹</button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  aria-current={p === page ? 'page' : undefined}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-[13px] transition-colors ${p === page ? 'text-white' : 'border border-line hover:bg-surface'}`}
                  style={p === page ? { background: 'var(--color-accent)' } : undefined}
                >
                  {p}
                </button>
              ))}
              <button onClick={() => goToPage(page + 1)} disabled={page === pageCount} aria-label="Next page" className="w-9 h-9 flex items-center justify-center rounded-lg border border-line hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors">›</button>
            </div>
          )}
        </>
      ) : suggestions.length > 0 && (
        <div>
          <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-6">YOU MAY LIKE</p>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 lg:gap-x-8 gap-y-10">
            {suggestions.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}
