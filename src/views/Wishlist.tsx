'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { useWishlist } from '../context/WishlistContext'
import { ProductCard } from '../components/ProductCard'
import { PatternGrid } from '../components/PatternGrid'
import { ListingPagination } from '../components/ListingPagination'
import { MaterialIcon } from '../components/MaterialIcon'
import { useReviewStatsMap } from '../lib/useReviewStatsMap'
import { ProductGridSkeleton } from '../components/Skeleton'
import { ACCOUNT_CARD, AccountPageHeader, PRIMARY_PILL, SELECT_PILL } from '../components/account/AccountUI'
import { LISTING_PAGE_SIZE } from '../lib/listingFilters'

const PAGE_SIZE = LISTING_PAGE_SIZE

type WishlistSort = 'newest' | 'oldest' | 'price-asc' | 'price-desc'

/** Wishlist grid — use `embedded` inside the account shell so the account nav stays visible. */
export function Wishlist({ embedded = false }: { embedded?: boolean }) {
  const { user, loading: authLoading } = useAuth()
  const { products, productsLoading, ready } = useWishlist()
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<WishlistSort>('newest')

  // Context order is newest saved first.
  const sorted = useMemo(() => {
    const list = [...products]
    if (sort === 'oldest') list.reverse()
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price)
    return list
  }, [products, sort])

  const pageCount = Math.ceil(sorted.length / PAGE_SIZE)
  const pagedProducts = useMemo(() => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [sorted, page])
  const reviewStatsMap = useReviewStatsMap(pagedProducts)

  const loading = authLoading || !ready || productsLoading
  const count = products.length

  const goToPage = (p: number) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const body = (
    <>
      <AccountPageHeader title="Wishlist" subtitle="Patterns you saved for later." />
      {!user && (
        <p className="-mt-2 mb-5 text-[14px] md:text-[13px] leading-relaxed text-muted">
          Wishlist items are saved for 7 days. Sign in to save them permanently.
        </p>
      )}
      {loading ? (
        <ProductGridSkeleton variant="wishlist" />
      ) : count === 0 ? (
        <div className={`${ACCOUNT_CARD} px-6 py-12 md:py-14 text-center`}>
          <span className="mx-auto mb-5 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-primary-soft" aria-hidden>
            <MaterialIcon name="favorite" size={34} color="var(--color-primary)" />
          </span>
          <p className="font-heading text-[24px] font-bold text-ink">Save patterns you love</p>
          <p className="mx-auto mt-2 max-w-[400px] text-[16px] md:text-[15px] leading-relaxed text-muted">
            Discover crochet patterns and save your favorites here for later.
          </p>
          <Link href="/shop" className={`${PRIMARY_PILL} mt-6 min-h-[52px] w-full sm:w-auto sm:min-w-[220px]`}>
            Explore patterns
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-5 flex items-center justify-between gap-4">
            <p className="text-[15px] md:text-[14px] text-muted">
              {count} saved {count === 1 ? 'pattern' : 'patterns'}
            </p>
            <label>
              <span className="sr-only">Sort wishlist</span>
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value as WishlistSort); setPage(1) }}
                className={SELECT_PILL}
              >
                <option value="newest">Sort: Newest</option>
                <option value="oldest">Sort: Oldest</option>
                <option value="price-asc">Sort: Price low to high</option>
                <option value="price-desc">Sort: Price high to low</option>
              </select>
            </label>
          </div>
          <PatternGrid variant="wishlist">
            {pagedProducts.map((p) => (
              <ProductCard key={p.id} product={p} reviewStats={reviewStatsMap.get(p.id)} />
            ))}
          </PatternGrid>
          <ListingPagination currentPage={page} pageCount={pageCount} onPageChange={goToPage} />
        </>
      )}
    </>
  )

  if (embedded) return <div>{body}</div>

  return <div className="max-w-site w-full mx-auto px-5 md:px-8 pt-5 md:pt-8 pb-16">{body}</div>
}
