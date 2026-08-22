export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-6 lg:gap-x-8 gap-y-10 lg:gap-y-14">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[3/4] bg-surface rounded-xl mb-4" />
          <div className="h-3.5 bg-surface rounded w-3/4 mb-2" />
          <div className="h-3.5 bg-surface rounded w-1/3" />
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
          <div className="h-3.5 bg-surface rounded flex-1 max-w-[160px]" />
          <div className="h-3.5 bg-surface rounded w-16" />
          <div className="h-5 bg-surface rounded-full w-20" />
        </div>
      ))}
    </div>
  )
}
