'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useUpdateSearchParams } from '../lib/useUpdateSearchParams'
import { supabase } from '../lib/supabase'
import { getSubcategoriesWithCounts, type SubcategoryWithCount } from '../lib/categories'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'
import type { Product, Category } from '../lib/types'
import { ProductCard } from '../components/ProductCard'
import { MaterialIcon } from '../components/MaterialIcon'
import { ProductGridSkeleton } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'

const LEVELS = ['beginner', 'intermediate', 'advanced'] as const

export function Shop() {
  const params = useParams()
  const categorySlug = typeof params?.categorySlug === 'string' ? params.categorySlug : undefined
  const [searchParams, setSearchParams] = useUpdateSearchParams()
  const level = searchParams?.get('level') ?? null
  const priceFilter = searchParams?.get('price') ?? null
  const bundleFilter = searchParams?.get('bundle') === '1'
  const saleFilter = searchParams?.get('sale') === '1'
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [sidebarCategories, setSidebarCategories] = useState<SubcategoryWithCount[]>([])
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const currentCategory = categories.find((c) => c.slug === categorySlug)
  const parentCategory = currentCategory?.parent_id ? categories.find((c) => c.id === currentCategory.parent_id) : null
  const categoryName = categorySlug === 'sale' ? 'Sale' : categorySlug === 'new' ? 'New Arrivals' : currentCategory?.name
useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => setCategories((data as Category[]) ?? []))
  }, [])

  // Sidebar: subcategories of the current main category, or — if we're already
  // on a subcategory page — its sibling subcategories (so you can switch
  // between Wild Animals / Pet Animals / etc without going back to the menu).
  useEffect(() => {
    if (!currentCategory) { setSidebarCategories([]); return }
    const parentId = currentCategory.parent_id ?? currentCategory.id
    getSubcategoriesWithCounts(parentId).then(setSidebarCategories)
  }, [currentCategory?.id])

  useEffect(() => {
    setLoading(true)
    let query = supabase.from('products').select('*').eq('active', true)
    if (level) query = query.eq('skill_level', level)
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
      let rows = (data as Product[]) ?? []
      // "On sale" isn't a single-column filter (needs compare_at_price > price,
      // not just "is set") — Supabase can't compare two columns directly, so
      // this stays a real client-side check on the already-fetched rows,
      // matching the exact same isOnSale logic ProductCard uses for the badge.
      if (saleFilter) rows = rows.filter((p) => p.price > 0 && !!p.compare_at_price && p.compare_at_price > p.price)
      setProducts(rows)
      setLoading(false)
    })
  }, [level, priceFilter, bundleFilter, saleFilter, categorySlug, categories])

  useEffect(() => {
    if (loading || products.length > 0) return
    supabase.from('products').select('*').eq('active', true).order('wishlist_count', { ascending: false }).limit(4)
      .then(({ data }) => setSuggestions((data as Product[]) ?? []))
  }, [loading, products.length])

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
              : level
                ? `${level.charAt(0).toUpperCase()}${level.slice(1)} Patterns`
                : 'All Patterns'

  const [sort, setSort] = useState<'newest' | 'price-asc' | 'price-desc'>('newest')
  const [page, setPage] = useState(1)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  useBodyScrollLock(mobileFiltersOpen)
  const PAGE_SIZE = 15

  useEffect(() => {
    setPage(1)
  }, [level, priceFilter, bundleFilter, saleFilter, categorySlug, sort])

  const sortedProducts = [...products].sort((a, b) => {
    if (sort === 'price-asc') return a.price - b.price
    if (sort === 'price-desc') return b.price - a.price
    return 0 // already newest-first from the query
  })

  const pageCount = Math.ceil(sortedProducts.length / PAGE_SIZE)
  const pagedProducts = sortedProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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

  const activeFilterCount = (level ? 1 : 0) + (priceFilter === 'free' ? 1 : 0) + (saleFilter ? 1 : 0) + (bundleFilter ? 1 : 0)

  const filterPanelContent = (
    <>
      <div>
        <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-3">SKILL LEVEL</p>
        <div className="space-y-0.5">
          <button
            onClick={() => setSearchParams((p) => { p.delete('level'); return p })}
            className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${!level ? 'bg-surface font-medium text-ink' : 'text-ink-soft hover:bg-surface hover:text-ink'}`}
          >
            All Levels
          </button>
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => toggleParam('level', l)}
              className={`w-full text-left px-3 py-2 rounded-lg text-[13px] capitalize transition-colors ${level === l ? 'bg-surface font-medium text-ink' : 'text-ink-soft hover:bg-surface hover:text-ink'}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-3">FILTERS</p>
        <div className="space-y-2.5">
          <label className="flex items-center gap-2.5 text-[13px] cursor-pointer">
            <input type="checkbox" checked={priceFilter === 'free'} onChange={() => toggleParam('price', 'free')} className="accent-ink" />
            Free patterns only
          </label>
          <label className="flex items-center gap-2.5 text-[13px] cursor-pointer">
            <input type="checkbox" checked={saleFilter} onChange={() => toggleParam('sale', '1')} className="accent-ink" />
            On sale
          </label>
          <label className="flex items-center gap-2.5 text-[13px] cursor-pointer">
            <input type="checkbox" checked={bundleFilter} onChange={() => toggleParam('bundle', '1')} className="accent-ink" />
            Bundles only
          </label>
        </div>
      </div>

      {sidebarCategories.length > 0 && (
        <div>
          <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-3">
            {parentCategory ? parentCategory.name.toUpperCase() : currentCategory?.name.toUpperCase()} CATEGORIES
          </p>
          <div className="space-y-0.5">
            <Link
              href={`/shop/${(parentCategory ?? currentCategory)!.slug}`}
              onClick={() => setMobileFiltersOpen(false)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-colors ${!parentCategory ? 'bg-surface font-medium text-ink' : 'text-ink-soft hover:bg-surface hover:text-ink'}`}
            >
              All {(parentCategory ?? currentCategory)!.name}
            </Link>
            {sidebarCategories.map((sc) => (
              <Link
                key={sc.id}
                href={`/shop/${sc.slug}`}
                onClick={() => setMobileFiltersOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-colors ${sc.slug === categorySlug ? 'bg-surface font-medium text-ink' : 'text-ink-soft hover:bg-surface hover:text-ink'}`}
              >
                <span>{sc.name}</span>
                <span className="text-[11px] text-ink-soft/70">{sc.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  )

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-16 py-14">
      <nav className="text-[11px] tracking-[0.08em] text-ink-soft mb-8 flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-ink">HOME</Link>
        {parentCategory && (
          <>
            <span>/</span>
            <Link href={`/shop/${parentCategory.slug}`} className="hover:text-ink">{parentCategory.name.toUpperCase()}</Link>
          </>
        )}
        <span>/</span>
        <span className="text-ink">{title.toUpperCase()}</span>
      </nav>

      <div className="border-b border-line pb-6 md:pb-8 mb-6 md:mb-10">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-5 md:mb-0">
          <div>
            <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-3">SHOP</p>
            <h1 className="font-display font-semibold text-[28px] sm:text-3xl md:text-4xl leading-tight break-words">{title}</h1>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="hidden md:block text-[11px] tracking-[0.1em] border border-line px-4 py-2.5 bg-canvas focus:outline-none focus:border-ink"
          >
            <option value="newest">NEWEST</option>
            <option value="price-asc">PRICE: LOW TO HIGH</option>
            <option value="price-desc">PRICE: HIGH TO LOW</option>
          </select>
        </div>

        {/* Mobile: compact Sort + Filter buttons instead of the full panel taking up the screen */}
        <div className="flex md:hidden items-center gap-3">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="flex-1 text-[12px] border border-line rounded-full px-4 py-2.5 bg-canvas focus:outline-none focus:border-ink"
          >
            <option value="newest">Sort: Newest</option>
            <option value="price-asc">Sort: Price low to high</option>
            <option value="price-desc">Sort: Price high to low</option>
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
              onClick={() => setSearchParams((p) => { p.delete('level'); p.delete('price'); p.delete('sale'); p.delete('bundle'); return p })}
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
            <ProductGridSkeleton />
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
                    {suggestions.map((p) => <ProductCard key={p.id} product={p} />)}
                  </div>
                </>
              )}
            </EmptyState>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 lg:gap-x-8 gap-y-10 lg:gap-y-14">
                {pagedProducts.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
              </div>

              {pageCount > 1 && (
                <div className="flex items-center justify-center gap-2 mt-14">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 1}
                    aria-label="Previous page"
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-line hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ‹
                  </button>
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      aria-label={`Page ${p}`}
                      aria-current={p === page ? 'page' : undefined}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg text-[13px] transition-colors ${p === page ? 'text-white' : 'border border-line hover:bg-surface'}`}
                      style={p === page ? { background: 'var(--color-accent)' } : undefined}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page === pageCount}
                    aria-label="Next page"
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-line hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                    onClick={() => setSearchParams((p) => { p.delete('level'); p.delete('price'); p.delete('sale'); p.delete('bundle'); return p })}
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
                className="w-full py-3.5 rounded-lg text-white text-[13px] font-semibold"
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
