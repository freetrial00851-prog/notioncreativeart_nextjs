'use client'

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useWishlist } from '../context/WishlistContext'
import { ProductCard } from '../components/ProductCard'
import { ListingPagination } from '../components/ListingPagination'
import { useReviewStatsMap } from '../lib/useReviewStatsMap'
import { EmptyState } from '../components/EmptyState'
import { ProductGridSkeleton } from '../components/Skeleton'

import { LISTING_PAGE_SIZE, LISTING_PRODUCT_GRID_CLASS } from '../lib/listingFilters'

const PAGE_SIZE = LISTING_PAGE_SIZE

/** Wishlist grid — use `embedded` inside the account shell so sidebar nav stays visible. */
export function Wishlist({ embedded = false }: { embedded?: boolean }) {
  const { user, loading: authLoading } = useAuth()
  const { products, productsLoading, ready } = useWishlist()
  const [page, setPage] = useState(1)

  if (authLoading || !ready || productsLoading) return <ProductGridSkeleton variant="wishlist" />

  const pageCount = Math.ceil(products.length / PAGE_SIZE)
  const pagedProducts = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const reviewStatsMap = useReviewStatsMap(pagedProducts)
  const goToPage = (p: number) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const guestHint = !user ? (
    <p className="text-[12px] text-ink-soft mb-6 leading-relaxed">
      Wishlist items are saved for 7 days. Sign in to save them permanently.
    </p>
  ) : null

  const body = (
    <>
      {guestHint}
      {products.length === 0 ? (
        <EmptyState
          icon="favorite"
          title="Save patterns you love."
          subtitle="Discover crochet patterns and save your favorites here for later."
          actionLabel="Explore Patterns"
          actionTo="/shop"
        />
      ) : (
        <>
          <div className={LISTING_PRODUCT_GRID_CLASS}>
            {pagedProducts.map((p) => (
              <ProductCard key={p.id} product={p} reviewStats={reviewStatsMap.get(p.id)} />
            ))}
          </div>
          <ListingPagination currentPage={page} pageCount={pageCount} onPageChange={goToPage} />
        </>
      )}
    </>
  )

  if (embedded) {
    return (
      <div>
        <h2 className="font-display font-semibold text-3xl md:text-4xl mb-6">Wishlist</h2>
        {body}
      </div>
    )
  }

  return (
    <div className="max-w-site w-full mx-auto px-4 md:px-16 py-14">
      <div className="border-b border-line pb-8 mb-10">
        <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-3">MY ACCOUNT</p>
        <h1 className="font-display font-semibold text-3xl md:text-4xl">Wishlist</h1>
      </div>
      {body}
    </div>
  )
}
