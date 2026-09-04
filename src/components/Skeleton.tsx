/** Shared pulse skeleton building blocks — each variant mirrors its real content layout. */

import { HOME_PRODUCT_GRID_CLASS } from '../lib/homeProductGrid'

function Bone({ className = '' }: { className?: string }) {
  return <div className={`bg-skeleton rounded animate-pulse ${className}`} />
}

/** Matches `ProductCard`: square image, 2-line title, price + circular action. */
function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-line overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]" aria-hidden>
      <Bone className="aspect-square rounded-none" />
      <div className="p-3">
        <Bone className="h-3.5 w-full mb-1.5" />
        <Bone className="h-3.5 w-2/3 mb-2.5" />
        <div className="flex items-center justify-between gap-2">
          <Bone className="h-4 w-14" />
          <Bone className="h-9 w-9 rounded-full shrink-0" />
        </div>
      </div>
    </div>
  )
}

export type ProductGridVariant = 'featured' | 'newArrivals' | 'freePatterns' | 'shop' | 'search' | 'wishlist'

const PRODUCT_GRID: Record<ProductGridVariant, { className: string; itemClassName?: string; defaultCount: number }> = {
  // Home Featured Items, New Arrivals, Free Patterns — 2 / 3 / 6 column tiers
  featured: {
    className: HOME_PRODUCT_GRID_CLASS,
    defaultCount: 6,
  },
  newArrivals: {
    className: HOME_PRODUCT_GRID_CLASS,
    defaultCount: 6,
  },
  freePatterns: {
    className: HOME_PRODUCT_GRID_CLASS,
    defaultCount: 6,
  },
  // Shop / category listing (PAGE_SIZE 15)
  shop: {
    className: 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 lg:gap-x-8 gap-y-10 lg:gap-y-14',
    defaultCount: 15,
  },
  // Search results
  search: {
    className: 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-6 lg:gap-x-8 gap-y-10 lg:gap-y-14',
    defaultCount: 15,
  },
  // Wishlist / account grids
  wishlist: {
    className: 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 lg:gap-x-8 gap-y-10 lg:gap-y-14',
    defaultCount: 8,
  },
}

export function ProductGridSkeleton({
  count,
  variant = 'shop',
}: {
  count?: number
  variant?: ProductGridVariant
}) {
  const { className, itemClassName, defaultCount } = PRODUCT_GRID[variant]
  const n = count ?? defaultCount
  return (
    <div className={className} aria-hidden>
      {Array.from({ length: n }).map((_, i) =>
        itemClassName ? (
          <div key={i} className={itemClassName}>
            <ProductCardSkeleton />
          </div>
        ) : (
          <ProductCardSkeleton key={i} />
        ),
      )}
    </div>
  )
}

/** Compact product tile used in skill-browse (square + 1-line title + price). */
export function SkillBrowseSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-6" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Bone className="aspect-square rounded-lg mb-2" />
          <Bone className="h-3 w-full mb-1" />
          <Bone className="h-3.5 w-12" />
        </div>
      ))}
    </div>
  )
}

/** Horizontal “Shop by Category” row — circular thumbs + name + count. */
export function CategoryRowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-4 md:gap-6 overflow-hidden pb-2 -mx-1 px-8 md:px-10" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col items-center text-center shrink-0 w-[100px] md:w-[120px]">
          <Bone className="w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-full mb-3" />
          <Bone className="h-3.5 w-16 mb-1.5" />
          <Bone className="h-2.5 w-14" />
        </div>
      ))}
    </div>
  )
}

/** Skill Level Chapters cards — mobile horizontal / desktop vertical. */
export function ChaptersSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-line overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-row md:flex-col"
        >
          <Bone className="w-28 sm:w-32 shrink-0 aspect-square md:w-full md:aspect-[4/3] rounded-none" />
          <div className="flex-1 min-w-0 p-4 md:p-6 space-y-3">
            <Bone className="h-5 md:h-6 w-2/3" />
            <div className="flex gap-1.5">
              <Bone className="h-1.5 w-1.5 rounded-full" />
              <Bone className="h-1.5 w-1.5 rounded-full" />
              <Bone className="h-1.5 w-1.5 rounded-full" />
            </div>
            <Bone className="h-3.5 w-full" />
            <Bone className="h-3.5 w-5/6" />
            <Bone className="h-3.5 w-20 mt-1" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Testimonials carousel page — 3 quote cards. */
export function TestimonialsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-line rounded-2xl p-6 space-y-4">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, si) => (
              <Bone key={si} className="h-3.5 w-3.5 rounded-sm" />
            ))}
          </div>
          <Bone className="h-3.5 w-full" />
          <Bone className="h-3.5 w-full" />
          <Bone className="h-3.5 w-4/5" />
          <div className="flex items-center gap-3 pt-1">
            <Bone className="w-9 h-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Bone className="h-3.5 w-24" />
              <Bone className="h-2.5 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** @deprecated Prefer ProductGridSkeleton / section-specific skeletons. Kept for any stray imports. */
export function HomeSectionSkeleton({ count = 5 }: { count?: number }) {
  return <ProductGridSkeleton count={count} variant="featured" />
}

/** Account orders table rows. */
export function ListRowSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="bg-white border border-line rounded-2xl overflow-hidden" aria-hidden>
      <div className="hidden sm:grid grid-cols-[minmax(0,1.2fr)_0.8fr_0.5fr_0.7fr_0.8fr_0.7fr] gap-3 px-5 py-3 border-b border-line bg-surface/50">
        {Array.from({ length: 6 }).map((_, i) => (
          <Bone key={i} className="h-2.5 w-12" />
        ))}
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.2fr)_0.8fr_0.5fr_0.7fr_0.8fr_0.7fr] gap-3 items-center px-5 py-4">
            <Bone className="h-3.5 w-28" />
            <Bone className="h-3.5 w-20 hidden sm:block" />
            <Bone className="h-3.5 w-8 hidden sm:block" />
            <Bone className="h-3.5 w-14 hidden sm:block" />
            <Bone className="h-6 w-20 rounded-full" />
            <Bone className="h-8 w-16 rounded-full justify-self-end hidden sm:block" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Account downloads table. */
export function DownloadsTableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="bg-white border border-line rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]" aria-hidden>
      <div className="hidden sm:grid grid-cols-[minmax(0,1.5fr)_0.8fr_0.7fr_0.8fr] gap-3 px-5 py-3 border-b border-line bg-surface/50">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} className="h-2.5 w-14" />
        ))}
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex sm:grid sm:grid-cols-[minmax(0,1.5fr)_0.8fr_0.7fr_0.8fr] gap-3 items-center px-5 py-3.5">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Bone className="w-12 h-12 rounded-lg shrink-0" />
              <Bone className="h-3.5 w-40 max-w-full" />
            </div>
            <Bone className="h-3.5 w-20 hidden sm:block" />
            <Bone className="h-3.5 w-16 hidden sm:block" />
            <Bone className="h-8 w-24 rounded-full justify-self-end shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Full product detail page placeholder — mirrors gallery | info + purchase. */
export function ProductDetailSkeleton() {
  return (
    <div className="max-w-site w-full mx-auto px-6 md:px-16 py-8 md:py-10" aria-hidden>
      <Bone className="h-3 w-64 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)] gap-6 lg:gap-8">
        <div>
          <Bone className="aspect-square rounded-2xl mb-3" />
          <div className="flex gap-2 justify-center">
            {Array.from({ length: 4 }).map((_, i) => (
              <Bone key={i} className="w-16 h-16 rounded-lg shrink-0" />
            ))}
          </div>
        </div>
        <div className="space-y-4 pt-1">
          <Bone className="h-5 w-24 rounded-full" />
          <Bone className="h-9 w-4/5" />
          <div className="rounded-2xl border border-line p-5 space-y-3">
            <Bone className="h-8 w-32" />
            <Bone className="h-12 w-full rounded-full" />
            <Bone className="h-12 w-full rounded-full" />
            <Bone className="h-11 w-full rounded-full" />
            <Bone className="h-20 w-full rounded-xl" />
          </div>
          <div className="space-y-2.5 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Bone key={i} className="h-4 w-3/4" />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-14 flex gap-6 border-b border-line pb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Bone key={i} className="h-3 w-20" />
        ))}
      </div>
      <div className="pt-8 space-y-3">
        <Bone className="h-6 w-48 mb-2" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-4/5" />
      </div>
    </div>
  )
}

/** Compact page-level fallback for Suspense boundaries (shop). */
export function PageSkeleton() {
  return (
    <div className="max-w-site w-full mx-auto px-6 md:px-16 py-10 md:py-14 space-y-8" aria-hidden>
      <Bone className="h-8 w-48" />
      <Bone className="h-4 w-72" />
      <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-10">
        <div className="hidden lg:block space-y-6">
          <Bone className="h-4 w-24" />
          <Bone className="h-10 w-full rounded-full" />
          <Bone className="h-4 w-20" />
          <Bone className="h-24 w-full rounded-full" />
        </div>
        <ProductGridSkeleton variant="shop" />
      </div>
    </div>
  )
}

/** Search results loading. */
export function SearchSkeleton() {
  return (
    <div className="max-w-site w-full mx-auto px-6 md:px-16 py-10 md:py-14 space-y-8" aria-hidden>
      <div className="border-b border-line pb-4 flex items-center justify-between">
        <Bone className="h-3 w-16" />
        <Bone className="h-3 w-20" />
      </div>
      <ProductGridSkeleton variant="search" />
    </div>
  )
}

/** Cart page — line items + order summary. */
export function ContentSkeleton() {
  return (
    <div className="max-w-site w-full mx-auto px-6 md:px-16 py-10" aria-hidden>
      <Bone className="h-3 w-28 mb-6" />
      <Bone className="h-9 w-48 mb-2" />
      <Bone className="h-3.5 w-64 mb-10" />
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
        <div className="bg-white border border-line rounded-2xl overflow-hidden divide-y divide-line">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 items-center p-6">
              <Bone className="w-24 h-24 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <Bone className="h-4 w-2/3" />
                <Bone className="h-5 w-28 rounded-full" />
                <Bone className="h-3 w-36" />
              </div>
              <Bone className="h-4 w-14 shrink-0" />
              <Bone className="h-9 w-9 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
        <div className="bg-white border border-line rounded-2xl p-6 space-y-4">
          <Bone className="h-3 w-28" />
          <div className="flex justify-between">
            <Bone className="h-3.5 w-16" />
            <Bone className="h-3.5 w-14" />
          </div>
          <div className="flex justify-between pt-3 border-t border-line">
            <Bone className="h-4 w-12" />
            <Bone className="h-4 w-16" />
          </div>
          <Bone className="h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
  )
}
