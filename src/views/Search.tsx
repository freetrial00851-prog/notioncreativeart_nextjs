'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUpdateSearchParams } from '../lib/useUpdateSearchParams'
import { supabase } from '../lib/supabase'
import { searchProducts } from '../lib/productSearch'
import type { Product } from '../lib/types'
import { ProductCard } from '../components/ProductCard'
import { useReviewStatsMapForLists } from '../lib/useReviewStatsMap'
import { EmptyState } from '../components/EmptyState'
import { ProductGridSkeleton } from '../components/Skeleton'
import { ProductListingFilters } from '../components/ProductListingFilters'
import { MaterialIcon } from '../components/MaterialIcon'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'
import { fetchPaidPurchaseCounts } from '../lib/purchaseCounts'
import {
  LISTING_PAGE_SIZE,
  LISTING_PRODUCT_GRID_CLASS,
  LISTING_SORT_OPTIONS,
  clearListingFilterParams,
  clearSkillLevelParam,
  countActiveListingFilters,
  filterProductsByListingParams,
  parseSkillLevels,
  serializeSkillLevels,
  sortProductsByListingSort,
  toggleSkillLevel,
  type ListingSkillLevel,
  type ListingSort,
} from '../lib/listingFilters'

export function Search() {
  const router = useRouter()
  const [searchParams, setSearchParams] = useUpdateSearchParams()
  const q = searchParams?.get('q') ?? ''
  const levels = useMemo(() => parseSkillLevels(searchParams?.get('level')), [searchParams])
  const levelsKey = levels.join(',')
  const priceFilter = searchParams?.get('price') ?? null
  const bundleFilter = searchParams?.get('bundle') === '1'
  const saleFilter = searchParams?.get('sale') === '1'

  const [results, setResults] = useState<Product[]>([])
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [loading, setLoading] = useState(() => Boolean(q.trim()))
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<ListingSort>('newest')
  const [purchaseCounts, setPurchaseCounts] = useState<Map<string, number>>(() => new Map())
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  useBodyScrollLock(mobileFiltersOpen)

  useEffect(() => {
    let cancelled = false
    setPage(1)
    if (!q.trim()) {
      setResults([])
      setSuggestions([])
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

  const filteredResults = useMemo(
    () =>
      filterProductsByListingParams(results, {
        levels,
        free: priceFilter === 'free',
        paid: priceFilter === 'paid',
        sale: saleFilter,
        bundle: bundleFilter,
      }),
    [results, levels, priceFilter, saleFilter, bundleFilter],
  )

  useEffect(() => {
    setPage(1)
  }, [levelsKey, priceFilter, saleFilter, bundleFilter, sort])

  useEffect(() => {
    if (sort !== 'best-selling' || filteredResults.length === 0) {
      setPurchaseCounts(new Map())
      return
    }
    let cancelled = false
    fetchPaidPurchaseCounts(filteredResults.map((p) => p.id)).then((map) => {
      if (!cancelled) setPurchaseCounts(map)
    })
    return () => { cancelled = true }
  }, [sort, filteredResults])

  const sortedResults = useMemo(
    () => sortProductsByListingSort(filteredResults, sort, purchaseCounts),
    [filteredResults, sort, purchaseCounts],
  )

  useEffect(() => {
    if (loading || !q || results.length > 0) return
    supabase.from('products').select('*').eq('active', true).order('wishlist_count', { ascending: false }).limit(4)
      .then(({ data }) => setSuggestions((data as Product[]) ?? []))
  }, [loading, q, results.length])

  const PAGE_SIZE = LISTING_PAGE_SIZE
  const pageCount = Math.ceil(sortedResults.length / PAGE_SIZE)
  const pagedResults = sortedResults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const reviewStatsMap = useReviewStatsMapForLists([pagedResults, suggestions])

  const goToPage = (p: number) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleParam = (key: string, value: string) => {
    setSearchParams((p) => {
      if (p.get(key) === value) p.delete(key)
      else p.set(key, value)
      return p
    })
  }

  const onToggleLevel = (level: ListingSkillLevel) => {
    setSearchParams((p) => {
      const next = toggleSkillLevel(parseSkillLevels(p.get('level')), level)
      const serialized = serializeSkillLevels(next)
      if (serialized) p.set('level', serialized)
      else p.delete('level')
      return p
    })
  }

  const activeFilterCount = countActiveListingFilters({
    levels,
    priceFilter,
    saleFilter,
    bundleFilter,
  })

  const filterPanelContent = (
    <ProductListingFilters
      levels={levels}
      priceFilter={priceFilter}
      saleFilter={saleFilter}
      bundleFilter={bundleFilter}
      onToggleParam={toggleParam}
      onToggleLevel={onToggleLevel}
      onClearLevels={() => setSearchParams(clearSkillLevelParam)}
    />
  )

  const showListingChrome = Boolean(q.trim())

  const sortSelectDesktop = (
    <select
      value={sort}
      onChange={(e) => setSort(e.target.value as ListingSort)}
      className="hidden md:block text-[11px] tracking-[0.1em] border border-line px-4 py-2.5 bg-canvas focus:outline-none focus:border-ink"
    >
      {LISTING_SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )

  return (
    <div className="max-w-site w-full mx-auto px-6 md:px-16 xl:px-24 2xl:px-32 py-10 md:py-14">
      <div className="border-b border-line pb-4 mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] tracking-[0.15em] text-ink-soft">SEARCH</p>
          <h1 className="font-display font-semibold text-3xl md:text-4xl leading-tight mt-2 break-words">
            {q.trim() ? `Search: "${q.trim()}"` : 'Search Results'}
          </h1>
          {q && (
            <p className="text-[11px] tracking-[0.08em] text-ink-soft mt-2">
              {loading ? 'Searching…' : `${sortedResults.length} result${sortedResults.length === 1 ? '' : 's'}`}
            </p>
          )}
        </div>
        {showListingChrome && sortSelectDesktop}
      </div>

      {!q && (
        <p className="text-ink-soft text-[13px]">Type above to find patterns by name or description.</p>
      )}

      {showListingChrome && (
        <>
          <div className="flex md:hidden items-center gap-3 mb-6">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as ListingSort)}
              className="flex-1 text-[12px] border border-line rounded-full px-4 py-2.5 bg-canvas focus:outline-none focus:border-ink"
            >
              {LISTING_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.mobileLabel}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="flex items-center gap-1.5 border border-line rounded-full px-4 py-2.5 text-[12px] shrink-0"
            >
              <MaterialIcon name="tune" size={15} />
              Filter
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-10">
            <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start space-y-8">
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => setSearchParams(clearListingFilterParams)}
                  className="text-[11px] font-semibold tracking-[0.1em] underline underline-offset-2"
                  style={{ color: 'var(--color-accent)' }}
                >
                  RESET FILTERS
                </button>
              )}
              {filterPanelContent}
            </aside>

            <div className="min-w-0">
              {loading ? (
                <ProductGridSkeleton variant="search" />
              ) : sortedResults.length > 0 ? (
                <>
                  <div className={LISTING_PRODUCT_GRID_CLASS}>
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
              ) : (
                <div>
                  <EmptyState
                    icon="search_off"
                    title={
                      results.length > 0
                        ? 'No patterns match these filters'
                        : `No patterns found for "${q}"`
                    }
                    subtitle={
                      results.length > 0
                        ? 'Try clearing filters or adjusting your search.'
                        : 'Try different keywords or browse our categories.'
                    }
                    actionLabel="Browse categories"
                    actionTo="/shop"
                    afterAction={(
                      <button
                        type="button"
                        onClick={() => {
                          if (results.length > 0) {
                            setSearchParams(clearListingFilterParams)
                          } else {
                            router.push('/search')
                          }
                        }}
                        className="px-6 py-3 rounded-full border border-line text-[13px] font-semibold hover:bg-surface transition-colors"
                      >
                        {results.length > 0 ? 'Clear filters' : 'Clear search'}
                      </button>
                    )}
                  />
                  {results.length === 0 && suggestions.length > 0 && (
                    <div className="mt-14">
                      <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-6">YOU MAY LIKE</p>
                      <div className={LISTING_PRODUCT_GRID_CLASS}>
                        {suggestions.map((p) => (
                          <ProductCard key={p.id} product={p} reviewStats={reviewStatsMap.get(p.id)} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {mobileFiltersOpen && showListingChrome && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute left-0 right-0 bottom-0 max-h-[85vh] bg-canvas rounded-t-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-line shrink-0">
              <span className="font-subheading text-lg">Filters</span>
              <div className="flex items-center gap-4">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setSearchParams(clearListingFilterParams)}
                    className="text-[12px] font-semibold underline underline-offset-2"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    Reset
                  </button>
                )}
                <button aria-label="Close filters" type="button" onClick={() => setMobileFiltersOpen(false)} className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-ink text-lg leading-none">✕</button>
              </div>
            </div>
            <div className="overflow-y-auto px-6 py-5 space-y-8">
              {filterPanelContent}
            </div>
            <div className="p-4 border-t border-line shrink-0">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-3.5 rounded-full text-white text-[13px] font-semibold"
                style={{ background: 'var(--color-ink)' }}
              >
                Show {sortedResults.length} result{sortedResults.length === 1 ? '' : 's'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
