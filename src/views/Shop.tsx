'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useUpdateSearchParams } from '../lib/useUpdateSearchParams'
import { supabase } from '../lib/supabase'
import { getSubcategoriesWithCounts, type SubcategoryWithCount } from '../lib/categories'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'
import type { Product, Category } from '../lib/types'
import { ProductCard } from '../components/ProductCard'
import { useReviewStatsMapForLists } from '../lib/useReviewStatsMap'
import { MaterialIcon } from '../components/MaterialIcon'
import { ProductGridSkeleton } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { ProductListingFilters } from '../components/ProductListingFilters'
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
  type ListingSort,
} from '../lib/listingFilters'

export function Shop() {
  const params = useParams()
  const router = useRouter()
  const categorySlug = typeof params?.categorySlug === 'string' ? params.categorySlug : undefined
  const [searchParams, setSearchParams] = useUpdateSearchParams()
  const [, startNavTransition] = useTransition()
  const levels = useMemo(() => parseSkillLevels(searchParams?.get('level')), [searchParams])
  const levelsKey = levels.join(',')
  const priceFilter = searchParams?.get('price') ?? null
  const bundleFilter = searchParams?.get('bundle') === '1'
  const saleFilter = searchParams?.get('sale') === '1'
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [sidebarCategories, setSidebarCategories] = useState<SubcategoryWithCount[]>([])
  const [suggestions, setSuggestions] = useState<Product[]>([])
  /** True only on cold first paint — never for subsequent filter/category changes. */
  const [initialLoading, setInitialLoading] = useState(true)
  /** Refetch in flight while previous results stay on screen. */
  const [filterFetching, setFilterFetching] = useState(false)
  const hasLoadedOnce = useRef(false)
  const fetchGen = useRef(0)

  const currentCategory = categories.find((c) => c.slug === categorySlug)
  const parentCategory = currentCategory?.parent_id ? categories.find((c) => c.id === currentCategory.parent_id) : null
  const categoryName = categorySlug === 'sale' ? 'Sale' : categorySlug === 'new' ? 'New Arrivals' : currentCategory?.name

  /** Stable key so the product fetch effect doesn't re-run on array reference-only changes. */
  const categoriesKey = useMemo(
    () => categories.map((c) => `${c.id}:${c.slug}:${c.parent_id ?? ''}`).sort().join('|'),
    [categories],
  )

  /** Soft-navigate shop paths without clearing the grid to a skeleton. */
  const goShop = (href: string) => {
    startNavTransition(() => {
      router.push(href, { scroll: false })
    })
  }

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => setCategories((data as Category[]) ?? []))
  }, [])

  // Sidebar: subcategories of the current main category, or — if we're already
  // on a subcategory page — its sibling subcategories (so you can switch
  // between Wild Animals / Pet Animals / etc without going back to the menu).
  useEffect(() => {
    if (!currentCategory) { setSidebarCategories([]); return }
    const parentId = currentCategory.parent_id ?? currentCategory.id
    getSubcategoriesWithCounts(supabase, parentId).then(setSidebarCategories)
  }, [currentCategory?.id])

  useEffect(() => {
    // Wait for categories when filtering by a real category slug — otherwise the
    // first query would fetch the unfiltered catalog and flash wrong products.
    if (categorySlug && categorySlug !== 'sale' && categorySlug !== 'new' && categorySlug !== 'bestsellers' && categories.length === 0) {
      return
    }

    const gen = ++fetchGen.current
    const hasPrior = hasLoadedOnce.current
    if (hasPrior) setFilterFetching(true)
    else setInitialLoading(true)

    let query = supabase.from('products').select('*').eq('active', true)
    if (levels.length > 0) query = query.in('skill_level', levels)
    if (priceFilter === 'free') query = query.eq('price', 0)
    if (bundleFilter) query = query.eq('is_bundle', true)
    if (categorySlug === 'sale') {
      query = query.not('compare_at_price', 'is', null)
    } else if (categorySlug === 'bestsellers') {
      query = query.eq('featured', true)
    } else if (categorySlug && categorySlug !== 'new') {
      const cat = categories.find((c) => c.slug === categorySlug)
      if (cat) {
        if (cat.parent_id) {
          // Real subcategory — products tagged directly to it.
          query = query.eq('category_id', cat.id)
        } else {
          // Real main category — include its own products plus everything
          // tagged to any of its subcategories, so the parent page isn't
          // empty just because products live one level down.
          const subIds = categories.filter((c) => c.parent_id === cat.id).map((c) => c.id)
          query = query.in('category_id', [cat.id, ...subIds])
        }
      }
    }
    query.order('created_at', { ascending: false }).then(({ data }) => {
      if (gen !== fetchGen.current) return
      let rows = (data as Product[]) ?? []
      // "On sale" isn't a single-column filter (needs compare_at_price > price,
      // not just "is set") — Supabase can't compare two columns directly, so
      // this stays a real client-side check on the already-fetched rows.
      if (saleFilter) rows = filterProductsByListingParams(rows, { sale: true })
      setProducts(rows)
      hasLoadedOnce.current = true
      setInitialLoading(false)
      setFilterFetching(false)
    })
  }, [levelsKey, priceFilter, bundleFilter, saleFilter, categorySlug, categoriesKey])

  useEffect(() => {
    if (initialLoading || filterFetching || products.length > 0) return
    supabase.from('products').select('*').eq('active', true).order('wishlist_count', { ascending: false }).limit(4)
      .then(({ data }) => setSuggestions((data as Product[]) ?? []))
  }, [initialLoading, filterFetching, products.length])

  const title = categorySlug === 'new'
    ? 'New Arrivals'
    : categorySlug === 'sale'
      ? 'Sale'
      : categorySlug === 'bestsellers'
        ? 'Featured Items'
        : categorySlug
          ? currentCategory?.name ?? 'Shop'
        : bundleFilter
          ? 'Pattern Bundles'
          : priceFilter === 'free'
            ? 'Free Patterns'
            : saleFilter
              ? 'On Sale'
              : levels.length > 0
                ? `${levels.map((l) => l.charAt(0).toUpperCase() + l.slice(1)).join(' & ')} Patterns`
                : 'All Patterns'

  const [sort, setSort] = useState<ListingSort>('newest')
  const [page, setPage] = useState(1)
  const [purchaseCounts, setPurchaseCounts] = useState<Map<string, number>>(() => new Map())
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  useBodyScrollLock(mobileFiltersOpen)
  const PAGE_SIZE = LISTING_PAGE_SIZE

  useEffect(() => {
    setPage(1)
  }, [levelsKey, priceFilter, bundleFilter, saleFilter, categorySlug, sort])

  useEffect(() => {
    if (sort !== 'best-selling' || products.length === 0) {
      setPurchaseCounts(new Map())
      return
    }
    let cancelled = false
    fetchPaidPurchaseCounts(products.map((p) => p.id)).then((map) => {
      if (!cancelled) setPurchaseCounts(map)
    })
    return () => { cancelled = true }
  }, [sort, products])

  const sortedProducts = useMemo(
    () => sortProductsByListingSort(products, sort, purchaseCounts),
    [products, sort, purchaseCounts],
  )

  const pageCount = Math.ceil(sortedProducts.length / PAGE_SIZE)
  const pagedProducts = sortedProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const reviewStatsMap = useReviewStatsMapForLists([pagedProducts, suggestions])

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

  const onToggleLevel = (level: (typeof levels)[number]) => {
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
      categories={
        sidebarCategories.length > 0 ? (
          <div>
            <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-3">
              {parentCategory ? parentCategory.name.toUpperCase() : currentCategory?.name.toUpperCase()} CATEGORIES
            </p>
            <div className="space-y-0.5">
              <Link
                href={`/shop/${(parentCategory ?? currentCategory)!.slug}`}
                onClick={(e) => {
                  e.preventDefault()
                  setMobileFiltersOpen(false)
                  goShop(`/shop/${(parentCategory ?? currentCategory)!.slug}`)
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-full text-[13px] transition-colors ${!parentCategory ? 'bg-surface font-medium text-ink' : 'text-ink-soft hover:bg-surface hover:text-ink'}`}
              >
                All {(parentCategory ?? currentCategory)!.name}
              </Link>
              {sidebarCategories.map((sc) => (
                <Link
                  key={sc.id}
                  href={`/shop/${sc.slug}`}
                  onClick={(e) => {
                    e.preventDefault()
                    setMobileFiltersOpen(false)
                    goShop(`/shop/${sc.slug}`)
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-full text-[13px] transition-colors ${sc.slug === categorySlug ? 'bg-surface font-medium text-ink' : 'text-ink-soft hover:bg-surface hover:text-ink'}`}
                >
                  <span>{sc.name}</span>
                  <span className="text-[11px] text-ink-soft">{sc.count}</span>
                </Link>
              ))}
            </div>
          </div>
        ) : undefined
      }
    />
  )

  return (
    <div className="max-w-site w-full mx-auto px-6 md:px-16 xl:px-24 2xl:px-32 py-14">
      <nav className="text-[11px] tracking-[0.08em] text-ink-soft mb-3 flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-ink">HOME</Link>
        {parentCategory && (
          <>
            <span>/</span>
            <Link
              href={`/shop/${parentCategory.slug}`}
              onClick={(e) => {
                e.preventDefault()
                goShop(`/shop/${parentCategory.slug}`)
              }}
              className="hover:text-ink"
            >
              {parentCategory.name.toUpperCase()}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-ink">{title.toUpperCase()}</span>
      </nav>

      <div className="border-b border-line pb-4 md:pb-5 mb-4 md:mb-6">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-3 md:mb-0">
          <div>
            <h1 className="font-display font-semibold text-3xl md:text-4xl leading-tight break-words">{title}</h1>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as ListingSort)}
            className="hidden md:block text-[11px] tracking-[0.1em] border border-line px-4 py-2.5 bg-canvas focus:outline-none focus:border-ink"
          >
            {LISTING_SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {filterFetching && (
          <p
            className="mt-3 flex items-center gap-2 text-[11px] tracking-[0.08em] text-ink-soft"
            role="status"
            aria-live="polite"
          >
            <span
              className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border-2 border-ink-soft/25 border-t-[var(--color-accent)] animate-spin motion-reduce:animate-none"
              aria-hidden
            />
            Updating…
          </p>
        )}

        {/* Mobile: compact Sort + Filter buttons instead of the full panel taking up the screen */}
        <div className="flex md:hidden items-center gap-3">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-10">
        <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start space-y-8">
          {activeFilterCount > 0 && (
            <button
              onClick={() => setSearchParams(clearListingFilterParams)}
              className="text-[11px] font-semibold tracking-[0.1em] underline underline-offset-2"
              style={{ color: 'var(--color-accent)' }}
            >
              RESET FILTERS
            </button>
          )}
          {filterPanelContent}
        </aside>

        <div className="min-w-0" aria-busy={filterFetching || undefined}>
          {initialLoading ? (
            <ProductGridSkeleton variant="shop" />
          ) : sortedProducts.length === 0 ? (
            <EmptyState
              icon="auto_awesome"
              title="No patterns available yet"
              subtitle={categoryName ? `We're preparing something special for ${categoryName}.` : "We're preparing something special for this collection."}
              actionLabel="Explore All Patterns"
              actionTo="/shop"
            >
              {suggestions.length > 0 && (
                <>
                  <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-6 text-center">YOU MAY ALSO LIKE</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
                    {suggestions.map((p) => (
                      <ProductCard key={p.id} product={p} reviewStats={reviewStatsMap.get(p.id)} />
                    ))}
                  </div>
                </>
              )}
            </EmptyState>
          ) : (
            <>
              <div className={LISTING_PRODUCT_GRID_CLASS}>
                {pagedProducts.map((p, i) => (
                  <ProductCard key={p.id} product={p} priority={i < 4} reviewStats={reviewStatsMap.get(p.id)} />
                ))}
              </div>

              {pageCount > 1 && (
                <div className="flex items-center justify-center gap-2 mt-14">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 1}
                    aria-label="Previous page"
                    className="w-9 h-9 flex items-center justify-center rounded-full border border-line hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ‹
                  </button>
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      aria-label={`Page ${p}`}
                      aria-current={p === page ? 'page' : undefined}
                      className={`w-9 h-9 flex items-center justify-center rounded-full text-[13px] transition-colors ${p === page ? 'text-white' : 'border border-line hover:bg-surface'}`}
                      style={p === page ? { background: 'var(--color-accent)' } : undefined}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page === pageCount}
                    aria-label="Next page"
                    className="w-9 h-9 flex items-center justify-center rounded-full border border-line hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filter bottom sheet — Etsy-style: compact trigger button, full options in a sheet */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute left-0 right-0 bottom-0 max-h-[85vh] bg-canvas rounded-t-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-line shrink-0">
              <span className="font-subheading text-lg">Filters</span>
              <div className="flex items-center gap-4">
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => setSearchParams(clearListingFilterParams)}
                    className="text-[12px] font-semibold underline underline-offset-2"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    Reset
                  </button>
                )}
                <button aria-label="Close filters" onClick={() => setMobileFiltersOpen(false)} className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-ink text-lg leading-none">✕</button>
              </div>
            </div>
            <div className="overflow-y-auto px-6 py-5 space-y-8">
              {filterPanelContent}
            </div>
            <div className="p-4 border-t border-line shrink-0">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-3.5 rounded-full text-white text-[13px] font-semibold"
                style={{ background: 'var(--color-ink)' }}
              >
                Show {sortedProducts.length} result{sortedProducts.length === 1 ? '' : 's'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
