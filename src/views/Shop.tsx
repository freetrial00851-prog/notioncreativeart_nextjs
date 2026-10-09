'use client'

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useUpdateSearchParams } from '../lib/useUpdateSearchParams'
import { supabase } from '../lib/supabase'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'
import type { Product, Category } from '../lib/types'
import { PatternCard } from '../components/PatternCard'
import { PatternGrid } from '../components/PatternGrid'
import { ListingPagination } from '../components/ListingPagination'
import { useReviewStatsMapForLists } from '../lib/useReviewStatsMap'
import { ProductGridSkeleton } from '../components/Skeleton'
import {
  ShopFiltersOverlay,
  type ShopFilterDraft,
  type ShopFilterCategoryOption,
} from '../components/ShopFiltersOverlay'
import { Button } from '../components/ui/Button'
import { fetchPaidPurchaseCounts } from '../lib/purchaseCounts'
import {
  LISTING_PAGE_SIZE,
  LISTING_SORT_OPTIONS,
  clearListingFilterParams,
  countActiveListingFilters,
  filterProductsByListingParams,
  parseSkillLevels,
  serializeSkillLevels,
  sortProductsByListingSort,
  toggleSkillLevel,
  type ListingSort,
  type ListingSkillLevel,
} from '../lib/listingFilters'
import { resolveShopPageTitle } from '../lib/shopTitle'

const EMPTY_PURCHASE_COUNTS = new Map<string, number>()

function isListingSort(v: string | null): v is ListingSort {
  return LISTING_SORT_OPTIONS.some((o) => o.value === v)
}

const SORT_LABELS: Record<ListingSort, string> = {
  newest: 'Newest',
  'price-asc': 'Price low to high',
  'price-desc': 'Price high to low',
  'best-selling': 'Best selling',
}

function emptyDraft(): ShopFilterDraft {
  return { categorySlug: null, levels: [], price: null, sale: false, bundle: false }
}

export function Shop({
  initialTitle,
  initialCategoryName = null,
}: {
  initialTitle: string
  initialCategoryName?: string | null
}) {
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
  const sortParam = searchParams?.get('sort')
  const sort: ListingSort = isListingSort(sortParam) ? sortParam : 'newest'
  const pageParam = Number.parseInt(searchParams?.get('page') ?? '1', 10)
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [filterFetching, setFilterFetching] = useState(false)
  const hasLoadedOnce = useRef(false)
  const fetchGen = useRef(0)
  const [purchaseCounts, setPurchaseCounts] = useState<Map<string, number>>(() => new Map())
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterDraft, setFilterDraft] = useState<ShopFilterDraft>(emptyDraft)
  useBodyScrollLock(filtersOpen)

  const currentCategory = categories.find((c) => c.slug === categorySlug)
  const parentCategories = useMemo(
    () => categories.filter((c) => !c.parent_id),
    [categories],
  )
  const categoryOptions: ShopFilterCategoryOption[] = useMemo(
    () =>
      parentCategories.map((c) => {
        const subIds = categories.filter((s) => s.parent_id === c.id).map((s) => s.id)
        const ids = new Set([c.id, ...subIds])
        const count = products.filter((p) => p.category_id && ids.has(p.category_id)).length
        return { id: c.id, name: c.name, slug: c.slug, count }
      }),
    [parentCategories, categories, products],
  )

  const categoriesKey = useMemo(
    () => categories.map((c) => `${c.id}:${c.slug}:${c.parent_id ?? ''}`).sort().join('|'),
    [categories],
  )

  const goShop = (href: string) => {
    startNavTransition(() => {
      router.push(href, { scroll: false })
    })
  }

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => setCategories((data as Category[]) ?? []))
  }, [])

  useEffect(() => {
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
    if (priceFilter === 'paid') query = query.gt('price', 0)
    if (bundleFilter) query = query.eq('is_bundle', true)
    if (categorySlug === 'sale') {
      query = query.not('compare_at_price', 'is', null)
    } else if (categorySlug === 'bestsellers') {
      query = query.eq('featured', true)
    } else if (categorySlug && categorySlug !== 'new') {
      const cat = categories.find((c) => c.slug === categorySlug)
      if (cat) {
        if (cat.parent_id) {
          query = query.eq('category_id', cat.id)
        } else {
          const subIds = categories.filter((c) => c.parent_id === cat.id).map((c) => c.id)
          query = query.in('category_id', [cat.id, ...subIds])
        }
      }
    }
    query.order('created_at', { ascending: false }).then(({ data }) => {
      if (gen !== fetchGen.current) return
      let rows = (data as Product[]) ?? []
      if (saleFilter || categorySlug === 'sale') {
        rows = filterProductsByListingParams(rows, { sale: true })
      }
      setProducts(rows)
      hasLoadedOnce.current = true
      setInitialLoading(false)
      setFilterFetching(false)
    })
  }, [levelsKey, priceFilter, bundleFilter, saleFilter, categorySlug, categoriesKey])

  useEffect(() => {
    if (sort !== 'best-selling' || products.length === 0) return
    let cancelled = false
    fetchPaidPurchaseCounts(products.map((p) => p.id)).then((map) => {
      if (!cancelled) setPurchaseCounts(map)
    })
    return () => {
      cancelled = true
    }
  }, [sort, products])

  const countsForSort = sort === 'best-selling' ? purchaseCounts : EMPTY_PURCHASE_COUNTS

  const sortedProducts = useMemo(
    () => sortProductsByListingSort(products, sort, countsForSort),
    [products, sort, countsForSort],
  )

  const pageCount = Math.max(1, Math.ceil(sortedProducts.length / LISTING_PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pagedProducts = sortedProducts.slice(
    (safePage - 1) * LISTING_PAGE_SIZE,
    safePage * LISTING_PAGE_SIZE,
  )
  const reviewStatsMap = useReviewStatsMapForLists([pagedProducts])

  const rangeStart = sortedProducts.length === 0 ? 0 : (safePage - 1) * LISTING_PAGE_SIZE + 1
  const rangeEnd = Math.min(safePage * LISTING_PAGE_SIZE, sortedProducts.length)
  const showingLabel =
    sortedProducts.length === 0
      ? 'Showing 0 of 0 patterns'
      : `Showing ${rangeStart}–${rangeEnd} of ${sortedProducts.length} patterns`

  const title = resolveShopPageTitle({
    categorySlug,
    categoryName: currentCategory?.name ?? initialCategoryName,
    price: priceFilter,
    bundle: bundleFilter ? '1' : null,
    sale: saleFilter ? '1' : null,
    level: levelsKey || null,
  })
  const displayTitle = title || initialTitle

  const activeFilterCount = countActiveListingFilters({
    levels,
    priceFilter,
    saleFilter: saleFilter || categorySlug === 'sale',
    bundleFilter,
  }) + (categorySlug && categorySlug !== 'sale' && categorySlug !== 'new' && categorySlug !== 'bestsellers' ? 1 : 0)

  const setPage = (p: number) => {
    setSearchParams((params) => {
      if (p <= 1) params.delete('page')
      else params.set('page', String(p))
      return params
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const setSort = (next: ListingSort) => {
    setSearchParams((params) => {
      if (next === 'newest') params.delete('sort')
      else params.set('sort', next)
      params.delete('page')
      return params
    })
  }

  const onToggleLevel = (level: ListingSkillLevel) => {
    setSearchParams((p) => {
      const next = toggleSkillLevel(parseSkillLevels(p.get('level')), level)
      const serialized = serializeSkillLevels(next)
      if (serialized) p.set('level', serialized)
      else p.delete('level')
      p.delete('page')
      return p
    })
  }

  const toggleSale = () => {
    setSearchParams((p) => {
      if (p.get('sale') === '1') p.delete('sale')
      else p.set('sale', '1')
      p.delete('page')
      return p
    })
  }

  const toggleBundle = () => {
    setSearchParams((p) => {
      if (p.get('bundle') === '1') p.delete('bundle')
      else p.set('bundle', '1')
      p.delete('page')
      return p
    })
  }

  const toggleFreeQuick = () => {
    setSearchParams((p) => {
      if (p.get('price') === 'free') p.delete('price')
      else p.set('price', 'free')
      p.delete('page')
      return p
    })
  }

  const clearAllFilters = () => {
    setSearchParams((p) => {
      clearListingFilterParams(p)
      p.delete('page')
      return p
    })
    if (categorySlug) goShop('/shop')
  }

  const openFilters = () => {
    setFilterDraft({
      categorySlug:
        categorySlug && categorySlug !== 'sale' && categorySlug !== 'new' && categorySlug !== 'bestsellers'
          ? categorySlug
          : null,
      levels: [...levels],
      price: priceFilter === 'free' || priceFilter === 'paid' ? priceFilter : null,
      sale: saleFilter || categorySlug === 'sale',
      bundle: bundleFilter,
    })
    setFiltersOpen(true)
  }

  const draftResultCount = useMemo(() => {
    // Approximate from currently loaded unfiltered-by-draft products is imperfect;
    // recompute against last fetch by applying draft client-side on a wider set.
    // Use current products + reverse isn't available; count against products with
    // draft skill/price/sale/bundle only (category applied via navigation on Apply).
    return filterProductsByListingParams(products, {
      levels: filterDraft.levels,
      free: filterDraft.price === 'free',
      paid: filterDraft.price === 'paid',
      sale: filterDraft.sale,
      bundle: filterDraft.bundle,
    }).length
  }, [products, filterDraft])

  const applyDraft = () => {
    const qs = new URLSearchParams()
    const serialized = serializeSkillLevels(filterDraft.levels)
    if (serialized) qs.set('level', serialized)
    if (filterDraft.price) qs.set('price', filterDraft.price)
    if (filterDraft.sale) qs.set('sale', '1')
    if (filterDraft.bundle) qs.set('bundle', '1')
    if (sort !== 'newest') qs.set('sort', sort)
    const q = qs.toString()
    const path = filterDraft.categorySlug ? `/shop/${filterDraft.categorySlug}` : '/shop'
    setFiltersOpen(false)
    goShop(q ? `${path}?${q}` : path)
  }

  /** Category row “All patterns” — active when not on a category / free / sale path. */
  const isAllPatterns = !categorySlug && priceFilter !== 'free' && !saleFilter && categorySlug !== 'sale'
  const isFreePill = priceFilter === 'free'
  const isSalePill = saleFilter || categorySlug === 'sale'

  const skillPillClass = (level: ListingSkillLevel, active: boolean) => {
    if (!active) return 'border-border bg-surface text-ink'
    if (level === 'beginner')
      return 'border-transparent bg-[var(--color-skill-beginner-soft)] text-[var(--color-skill-beginner-ink)]'
    if (level === 'intermediate')
      return 'border-transparent bg-[var(--color-skill-intermediate-soft)] text-[var(--color-skill-intermediate-ink)]'
    return 'border-transparent bg-[var(--color-skill-advanced-soft)] text-[var(--color-skill-advanced-ink)]'
  }

  return (
    <div className="bg-bg min-h-[50vh]">
      <div className="max-w-site w-full mx-auto px-5 md:px-10 lg:px-8 py-8 md:py-10">
        <nav className="text-[12px] text-muted mb-3 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-ink">
            Home
          </Link>
          <span aria-hidden>›</span>
          <span className="text-ink">Shop</span>
        </nav>

        <h1 className="font-heading text-3xl md:text-4xl font-bold text-ink mb-2">{displayTitle}</h1>
        <p className="text-[13px] text-muted mb-5 md:mb-6" aria-live="polite">
          {filterFetching ? 'Updating…' : showingLabel}
          {activeFilterCount > 0 && !initialLoading ? (
            <>
              {' · '}
              <button type="button" onClick={clearAllFilters} className="text-primary font-semibold hover:underline">
                Clear all
              </button>
            </>
          ) : null}
        </p>

        {/* Desktop category pills — laptop only */}
        <div className="hidden lg:flex flex-wrap gap-2 mb-3">
          <FilterPill
            active={isAllPatterns}
            onClick={() => {
              const qs = new URLSearchParams(searchParams?.toString() ?? '')
              qs.delete('page')
              const q = qs.toString()
              goShop(q ? `/shop?${q}` : '/shop')
            }}
          >
            All patterns
          </FilterPill>
          {parentCategories.map((c) => (
            <FilterPill
              key={c.id}
              active={categorySlug === c.slug}
              href={`/shop/${c.slug}`}
              onNavigate={goShop}
            >
              {c.name}
            </FilterPill>
          ))}
          <FilterPill
            active={isFreePill}
            onClick={() => {
              if (isFreePill) {
                setSearchParams((p) => {
                  p.delete('price')
                  p.delete('page')
                  return p
                })
              } else {
                goShop('/shop?price=free')
              }
            }}
          >
            Free patterns
          </FilterPill>
          <FilterPill
            active={isSalePill}
            onClick={() => {
              if (isSalePill) {
                setSearchParams((p) => {
                  p.delete('sale')
                  p.delete('page')
                  return p
                })
                if (categorySlug === 'sale') goShop('/shop')
              } else {
                goShop('/shop?sale=1')
              }
            }}
          >
            Sale
          </FilterPill>
        </div>

        {/* Desktop skill / offers row — laptop */}
        <div className="hidden lg:flex flex-wrap items-center gap-2 mb-6">
          {(['beginner', 'intermediate', 'advanced'] as const).map((level) => {
            const active = levels.includes(level)
            return (
              <button
                key={level}
                type="button"
                onClick={() => onToggleLevel(level)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium ${skillPillClass(level, active)}`}
              >
                {active ? <CheckIcon /> : null}
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            )
          })}
          <span className="w-px h-6 bg-border mx-1" aria-hidden />
          <button
            type="button"
            onClick={toggleFreeQuick}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium ${
              isFreePill ? 'border-transparent bg-primary-soft text-primary' : 'border-border bg-surface text-ink'
            }`}
          >
            {isFreePill ? <CheckIcon /> : null}
            Free
          </button>
          <button
            type="button"
            onClick={toggleSale}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium ${
              isSalePill ? 'border-transparent bg-primary-soft text-primary' : 'border-border bg-surface text-ink'
            }`}
          >
            {isSalePill ? <CheckIcon /> : null}
            On sale
          </button>
          <button
            type="button"
            onClick={toggleBundle}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium ${
              bundleFilter ? 'border-transparent bg-primary-soft text-primary' : 'border-border bg-surface text-ink'
            }`}
          >
            {bundleFilter ? <CheckIcon /> : null}
            Bundles
          </button>
          <div className="flex-1 min-w-2" />
          <button
            type="button"
            onClick={openFilters}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-[13px] font-medium text-ink hover:bg-surface-warm"
          >
            <FilterGlyph />
            More filters
          </button>
          <label className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-[13px] font-medium text-ink">
            <span className="text-muted">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as ListingSort)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              {LISTING_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {SORT_LABELS[opt.value]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Mobile + tablet: Filters + Sort */}
        <div className="lg:hidden flex gap-2 mb-3">
          <button
            type="button"
            onClick={openFilters}
            className="flex-1 inline-flex items-center justify-center gap-2 min-h-11 rounded-full border border-border bg-surface text-[13px] font-semibold text-ink"
          >
            <FilterGlyph />
            Filters
            {activeFilterCount > 0 ? (
              <span className="min-w-5 h-5 px-1 rounded-full bg-primary text-white text-[11px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
          <label className="flex-1 inline-flex items-center justify-center gap-2 min-h-11 rounded-full border border-border bg-surface text-[13px] font-semibold text-ink px-3">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as ListingSort)}
              className="bg-transparent focus:outline-none cursor-pointer w-full text-center"
              aria-label="Sort"
            >
              {LISTING_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.mobileLabel}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Mobile + tablet quick pills */}
        <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 -mx-1 px-1 scrollbar-none">
          {(['beginner', 'intermediate', 'advanced'] as const).map((level) => {
            const active = levels.includes(level)
            return (
              <button
                key={level}
                type="button"
                onClick={() => onToggleLevel(level)}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium whitespace-nowrap ${skillPillClass(level, active)}`}
              >
                {active ? <CheckIcon /> : null}
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            )
          })}
          <button
            type="button"
            onClick={toggleFreeQuick}
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium whitespace-nowrap ${
              isFreePill ? 'border-transparent bg-primary-soft text-primary' : 'border-border bg-surface text-ink'
            }`}
          >
            {isFreePill ? <CheckIcon /> : null}
            Free
          </button>
          <button
            type="button"
            onClick={toggleSale}
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium whitespace-nowrap ${
              isSalePill ? 'border-transparent bg-primary-soft text-primary' : 'border-border bg-surface text-ink'
            }`}
          >
            {isSalePill ? <CheckIcon /> : null}
            On sale
          </button>
          <button
            type="button"
            onClick={toggleBundle}
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium whitespace-nowrap ${
              bundleFilter ? 'border-transparent bg-primary-soft text-primary' : 'border-border bg-surface text-ink'
            }`}
          >
            {bundleFilter ? <CheckIcon /> : null}
            Bundles
          </button>
        </div>

        <div aria-busy={filterFetching || undefined}>
          {initialLoading ? (
            <ProductGridSkeleton variant="shop" count={8} />
          ) : sortedProducts.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface px-6 py-14 text-center max-w-xl mx-auto">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary-soft flex items-center justify-center mb-5" aria-hidden>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="var(--color-primary)" strokeWidth="2" />
                  <path d="M20 20l-3.5-3.5" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h2 className="font-heading text-2xl font-bold text-ink mb-2">No patterns match your filters</h2>
              <p className="text-[14px] text-muted mb-6">
                Try removing a filter, or browse the full collection.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button variant="primary" size="md" onClick={clearAllFilters}>
                  Clear all filters
                </Button>
                <Link href="/shop?price=free">
                  <Button variant="secondary" size="md">
                    Browse free patterns
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <PatternGrid variant="shop">
                {pagedProducts.map((p, i) => (
                  <PatternCard key={p.id} product={p} priority={i < 4} reviewStats={reviewStatsMap.get(p.id)} />
                ))}
              </PatternGrid>
              <ListingPagination
                variant="simple"
                currentPage={safePage}
                pageCount={pageCount}
                onPageChange={setPage}
              />
              <ListingPagination
                variant="desktop"
                currentPage={safePage}
                pageCount={pageCount}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>

      {filtersOpen && (
        <>
          <ShopFiltersOverlay
            variant="sheet"
            draft={filterDraft}
            onChange={setFilterDraft}
            categories={categoryOptions}
            resultCount={draftResultCount}
            onClear={() => setFilterDraft(emptyDraft())}
            onApply={applyDraft}
            onClose={() => setFiltersOpen(false)}
          />
          <ShopFiltersOverlay
            variant="panel"
            draft={filterDraft}
            onChange={setFilterDraft}
            categories={categoryOptions}
            resultCount={draftResultCount}
            onClear={() => setFilterDraft(emptyDraft())}
            onApply={applyDraft}
            onClose={() => setFiltersOpen(false)}
          />
        </>
      )}
    </div>
  )
}

function FilterPill({
  active,
  children,
  href,
  onNavigate,
  onClick,
}: {
  active: boolean
  children: ReactNode
  href?: string
  onNavigate?: (href: string) => void
  onClick?: () => void
}) {
  const className = `inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors ${
    active ? 'border-transparent bg-primary text-white' : 'border-border bg-surface text-ink hover:bg-surface-warm'
  }`
  if (href && onNavigate) {
    return (
      <Link
        href={href}
        onClick={(e) => {
          e.preventDefault()
          onNavigate(href)
        }}
        className={className}
      >
        {active ? <CheckIcon light /> : null}
        {children}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {active ? <CheckIcon light /> : null}
      {children}
    </button>
  )
}

function CheckIcon({ light = false }: { light?: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12.5l5 5L20 7"
        stroke={light ? 'currentColor' : 'currentColor'}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function FilterGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
