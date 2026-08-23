/** Shared pulse skeleton building blocks for loading states. */

function Bone({ className = '' }: { className?: string }) {
  return <div className={`bg-surface rounded animate-pulse ${className}`} />
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-6 lg:gap-x-8 gap-y-10 lg:gap-y-14">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Bone className="aspect-[3/4] rounded-xl mb-4" />
          <Bone className="h-3.5 w-3/4 mb-2" />
          <Bone className="h-3.5 w-1/3" />
        </div>
      ))}
    </div>
  )
}

export function ListRowSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="divide-y divide-line border-t border-b border-line">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-4 animate-pulse">
          <Bone className="h-3.5 flex-1 max-w-[160px]" />
          <Bone className="h-3.5 w-16" />
          <Bone className="h-5 rounded-full w-20" />
        </div>
      ))}
    </div>
  )
}

/** Full product detail page placeholder — mirrors 3-panel gallery | details | purchase layout. */
export function ProductDetailSkeleton() {
  return (
    <div className="max-w-site w-full mx-auto px-6 md:px-16 py-8 md:py-10">
      <Bone className="h-3 w-64 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_minmax(260px,320px)] gap-8 xl:gap-10">
        <div>
          <Bone className="aspect-[1/1.05] rounded-2xl mb-3" />
          <div className="flex gap-2 justify-center">
            {Array.from({ length: 4 }).map((_, i) => (
              <Bone key={i} className="w-16 h-16 rounded-lg shrink-0" />
            ))}
          </div>
        </div>
        <div className="space-y-4 pt-1">
          <Bone className="h-5 w-24 rounded-full" />
          <Bone className="h-9 w-4/5" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-5/6" />
          <div className="space-y-2.5 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Bone key={i} className="h-4 w-3/4" />
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Bone key={i} className="h-7 w-16 rounded-full" />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-line p-5 space-y-3">
          <Bone className="h-8 w-32" />
          <Bone className="h-12 w-full rounded-lg" />
          <Bone className="h-12 w-full rounded-lg" />
          <Bone className="h-11 w-full rounded-lg" />
          <Bone className="h-20 w-full rounded-xl" />
        </div>
      </div>
      <div className="mt-14 flex gap-6 border-b border-line pb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Bone key={i} className="h-3 w-20" />
        ))}
      </div>
      <div className="pt-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
        <div className="space-y-3">
          <Bone className="h-6 w-48 mb-2" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-4/5" />
        </div>
        <Bone className="aspect-[4/5] rounded-2xl hidden lg:block" />
      </div>
    </div>
  )
}

/** Homepage product row / skill browse placeholder. */
export function HomeSectionSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Bone className="aspect-[3/4] rounded-xl mb-3" />
          <Bone className="h-3.5 w-3/4 mb-2" />
          <Bone className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  )
}

/** Compact page-level fallback for Suspense boundaries. */
export function PageSkeleton() {
  return (
    <div className="max-w-site w-full mx-auto px-6 md:px-16 py-16 space-y-8">
      <Bone className="h-8 w-48" />
      <Bone className="h-4 w-72" />
      <ProductGridSkeleton count={8} />
    </div>
  )
}

/** Search results loading. */
export function SearchSkeleton() {
  return (
    <div className="max-w-site w-full mx-auto px-6 md:px-16 py-12 space-y-8">
      <Bone className="h-10 w-full max-w-xl rounded-lg" />
      <Bone className="h-4 w-32" />
      <ProductGridSkeleton count={6} />
    </div>
  )
}

/** Cart / simple content page. */
export function ContentSkeleton() {
  return (
    <div className="max-w-[1000px] mx-auto px-6 md:px-16 py-16 space-y-6">
      <Bone className="h-8 w-40" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center py-4 border-b border-line">
          <Bone className="w-20 h-24 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Bone className="h-4 w-2/3" />
            <Bone className="h-3 w-1/4" />
          </div>
          <Bone className="h-4 w-14" />
        </div>
      ))}
    </div>
  )
}
