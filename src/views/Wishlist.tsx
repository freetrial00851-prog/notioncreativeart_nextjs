'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ProductCard } from '../components/ProductCard'
import { EmptyState } from '../components/EmptyState'
import { ProductGridSkeleton } from '../components/Skeleton'
import type { Product } from '../lib/types'

const PAGE_SIZE = 15

/** Wishlist grid — use `embedded` inside the account shell so sidebar nav stays visible. */
export function Wishlist({ embedded = false }: { embedded?: boolean }) {
  const { user, loading: authLoading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!user) return
    supabase
      .from('wishlist')
      .select('product:products(*)')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setProducts((data ?? []).map((row) => row.product).filter(Boolean) as unknown as Product[])
        setLoading(false)
      })
  }, [user])

  if (authLoading) return <ProductGridSkeleton count={4} />

  if (!user) {
    return (
      <div className={embedded ? 'py-16 text-center' : 'max-w-site w-full mx-auto px-8 py-32 text-center'}>
        <p className="font-subheading text-2xl mb-4">Sign in to see your wishlist.</p>
        <Link href="/" className="text-[12px] tracking-[0.12em] border-b border-ink pb-1">BACK TO HOME →</Link>
      </div>
    )
  }

  const pageCount = Math.ceil(products.length / PAGE_SIZE)
  const pagedProducts = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const goToPage = (p: number) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const body = (
    <>
      {loading ? (
        <ProductGridSkeleton count={4} />
      ) : products.length === 0 ? (
        <EmptyState
          icon="favorite"
          title="Save patterns you love."
          subtitle="Discover crochet patterns and save your favorites here for later."
          actionLabel="Explore Patterns"
          actionTo="/shop"
        />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 lg:gap-x-8 gap-y-10 lg:gap-y-14">
            {pagedProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          {pageCount > 1 && (
            <div className="flex items-center justify-center gap-2 mt-14">
              <button onClick={() => goToPage(page - 1)} disabled={page === 1} aria-label="Previous page" className="w-9 h-9 flex items-center justify-center rounded-lg border border-line hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors">‹</button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  aria-current={p === page ? 'page' : undefined}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-[13px] transition-colors ${p === page ? 'text-white' : 'border border-line hover:bg-surface'}`}
                  style={p === page ? { background: 'var(--color-accent)' } : undefined}
                >
                  {p}
                </button>
              ))}
              <button onClick={() => goToPage(page + 1)} disabled={page === pageCount} aria-label="Next page" className="w-9 h-9 flex items-center justify-center rounded-lg border border-line hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors">›</button>
            </div>
          )}
        </>
      )}
    </>
  )

  if (embedded) {
    return (
      <div>
        <h2 className="font-heading font-semibold text-2xl md:text-3xl mb-6">Wishlist</h2>
        {body}
      </div>
    )
  }

  return (
    <div className="max-w-site w-full mx-auto px-8 md:px-16 py-14">
      <div className="border-b border-line pb-8 mb-10">
        <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-3">MY ACCOUNT</p>
        <h1 className="font-display font-semibold text-4xl">Wishlist</h1>
      </div>
      {body}
    </div>
  )
}
