import type { ReactNode } from 'react'

type Variant = 'featured' | 'shop' | 'wishlist' | 'related'

/**
 * Responsive product grid — DESIGN_SPEC §3.7.
 * featured/shop/related: 2 / 2 / 4 cols (mobile / tablet / laptop)
 * wishlist: 2 / 2 / 3
 */
const GRID: Record<Variant, string> = {
  featured: 'grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-5 md:gap-x-5 md:gap-y-6',
  shop: 'grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-5 md:gap-x-5 md:gap-y-6',
  related: 'grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-5 md:gap-x-5 md:gap-y-6',
  wishlist: 'grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-5 md:gap-x-5 md:gap-y-6',
}

export function PatternGrid({
  variant = 'shop',
  children,
  className = '',
}: {
  variant?: Variant
  children: ReactNode
  className?: string
}) {
  return <div className={`${GRID[variant]} ${className}`}>{children}</div>
}
