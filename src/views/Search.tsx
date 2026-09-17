'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUpdateSearchParams } from '../lib/useUpdateSearchParams'
import { supabase } from '../lib/supabase'
import { searchProducts } from '../lib/productSearch'
import type { Product } from '../lib/types'
import { ProductCard } from '../components/ProductCard'
import { ListingPagination } from '../components/ListingPagination'
import { useReviewStatsMapForLists } from '../lib/useReviewStatsMap'
import { EmptyState } from '../components/EmptyState'
import { ProductGridSkeleton } from '../components/Skeleton'
import { ProductListingFilters } from '../components/ProductListingFilters'
import { SortFilterTriggerButton } from '../components/SortFilterTriggerButton'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'
import { fetchPaidPurchaseCounts } from '../lib/purchaseCounts'
import {
  LISTING_PAGE_SIZE,
  LISTING_PRODUCT_GRID_CLASS,
  LISTING_SORT_OPTIONS,
  clearListingFilterParams,
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
      onToggleParam={toggleParam}
      onToggleLevel={onToggleLevel}
    />
  )

  const sheetFilterContent = (
    <ProductListingFilters
      variant="sheet"
      levels={levels}
      priceFilter={priceFilter}
      onToggleParam={toggleParam}
      onToggleLevel={onToggleLevel}
      sort={sort}
      onSortChange={setSort}
    />
  )

  const resetSortAndFilters = () => {
    setSort('newest')
    setSearchParams(clearListingFilterParams)
  }

  const showListingChrome = Boolean(q.trim())

  const sortSelectDesktop = (
    <select
      value={sort}
      onChange={(e) => setSort(e.target.value as ListingSort)}
      className="hidden md:block shrink-0 text-[11px] tracking-[0.1em] border border-line px-4 py-2.5 bg-canvas focus:outline-none focus:border-ink"
    >
      {LISTING_SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )

  return (
    <div className="max-w-site w-full mx-auto px-4 md:px-16 xl:px-24 2xl:px-32 py-10 md:py-14">
      <div className="border-b border-line pb-4 mb-8 flex items-end justify-between gap-3 md:gap-4">
        <div className="min-w-0 flex-1">
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
        {showListingChrome && (
          <>
            <SortFilterTriggerButton
              className="md:hidden mb-0.5"
              activeFilterCount={activeFilterCount}
              onClick={() => setMobileFiltersOpen(true)}
            />
            {sortSelectDesktop}
          </>
        )}
      </div>

      {!q && (
        <p className="text-ink-soft text-[13px]">Type above to find patterns by name or description.</p>
      )}

      {showListingChrome && (
        <>
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
                  <ListingPagination currentPage={page} pageCount={pageCount} onPageChange={goToPage} />
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
          <div className="absolute left-0 right-0 bottom-0 bg-canvas rounded-t-2xl flex flex-col overflow-hidden shadow-[0_-8px_32px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between px-5 pt-3.5 pb-2.5 border-b border-line shrink-0">
              <span className="font-subheading text-[20px] font-bold leading-tight">Sort & Filter</span>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={resetSortAndFilters}
                  className="text-[12px] font-semibold underline underline-offset-2"
                  style={{ color: 'var(--color-accent)' }}
                >
                  Reset
                </button>
                <button
                  type="button"
                  aria-label="Close filters"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-ink text-lg leading-none"
                >
                  ✕
                </button>
              </div>
            </div>
            {/* max-h on the body alone — footer stays a sibling outside scroll, never overlaps */}
            <div
              className="listing-sheet-scroll overflow-y-auto overscroll-contain min-h-0 pb-2"
              style={{ maxHeight: 'min(62dvh, 460px)' }}
            >
              {sheetFilterContent}
            </div>
            <div className="px-5 pt-3 pb-4 border-t border-line bg-canvas shrink-0">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-3 rounded-full text-white text-[13px] font-semibold"
                style={{ background: 'var(--color-ink)' }}
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
