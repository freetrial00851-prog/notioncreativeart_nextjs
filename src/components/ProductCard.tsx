'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Product } from '../lib/types'
import { useUI } from '../context/UIContext'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'
import { QuickView } from './QuickView'
import { prefetchProduct } from '../lib/prefetchCache'
import { deriveVariantUrl } from '../lib/imageVariants'
import { claimAndDownloadFreePattern } from '../lib/downloads'
import { MaterialIcon } from './MaterialIcon'
import { FavoriteIcon, ShareIcon } from './icons'

const NEW_WINDOW_DAYS = 14

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { requireAuth } = useUI()
  const { user } = useAuth()
  const { addToCart, removeFromCart, isInCart } = useCart()
  const { showToast } = useToast()
  const router = useRouter()
  const [inWishlist, setInWishlist] = useState(false)
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const [downloadingFree, setDownloadingFree] = useState(false)
  const inCart = isInCart(product.id)

  useEffect(() => {
    if (!user) return setInWishlist(false)
    supabase
      .from('wishlist')
      .select('product_id')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .maybeSingle()
      .then(({ data }) => setInWishlist(!!data))
  }, [user, product.id])

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!requireAuth({ type: 'wishlist', productId: product.id })) return // not logged in — PendingActionRunner will add it once they sign in
    if (inWishlist) {
      await supabase.from('wishlist').delete().eq('user_id', user!.id).eq('product_id', product.id)
      setInWishlist(false)
      showToast('Removed from wishlist', 'info')
    } else {
      await supabase.from('wishlist').upsert({ user_id: user!.id, product_id: product.id })
      setInWishlist(true)
      showToast('♡ Saved to wishlist', 'success', { label: 'View Wishlist', onClick: () => router.push('/account/wishlist') })
    }
  }

  const toggleCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!requireAuth({ type: 'cart', productId: product.id })) return
    if (inCart) await removeFromCart(product.id)
    else await addToCart(product.id)
  }

  const downloadFree = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!requireAuth({ type: 'buy', productId: product.id })) return
    setDownloadingFree(true)
    const ok = await claimAndDownloadFreePattern(user!.id, product.id, product.title)
    setDownloadingFree(false)
    showToast(ok ? 'Downloading your pattern…' : "This pattern's file isn't uploaded yet — please check back soon.", ok ? 'success' : 'error')
  }

  const isNew = (Date.now() - new Date(product.created_at).getTime()) / (1000 * 60 * 60 * 24) <= NEW_WINDOW_DAYS
  const isOnSale = product.price > 0 && !!product.compare_at_price && product.compare_at_price > product.price

  return (
    <>
      <Link
        href={`/pattern/${product.slug}`}
        className="group block bg-white rounded-2xl border border-line overflow-hidden hover:shadow-md transition-shadow"
        onMouseEnter={() => prefetchProduct(product.slug)}
        onTouchStart={() => prefetchProduct(product.slug)}
      >
        <div className="relative aspect-square bg-surface overflow-hidden">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              srcSet={`${deriveVariantUrl(product.images[0], 'micro')} 160w, ${deriveVariantUrl(product.images[0], 'thumb')} 320w, ${product.images[0]} 640w, ${deriveVariantUrl(product.images[0], 'large')} 1000w`}
              sizes="(max-width: 768px) 50vw, 25vw"
              alt={product.title}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
              className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02] ${product.sold_out ? 'opacity-50' : ''}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-soft text-xs">No image yet</div>
          )}

          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
            <button
              onClick={toggleWishlist}
              aria-label="Add to wishlist"
              className="w-7 h-7 flex items-center justify-center bg-white rounded-full shadow-sm text-ink hover:opacity-70 transition-opacity"
            >
              <FavoriteIcon size={15} filled={inWishlist} color={inWishlist ? 'var(--color-madder)' : 'currentColor'} />
            </button>
            <button
              onClick={async (e) => {
                e.preventDefault()
                const url = `${window.location.origin}/pattern/${product.slug}`
                try {
                  if (navigator.share) {
                    await navigator.share({ title: product.title, url })
                  } else {
                    await navigator.clipboard.writeText(url)
                    showToast('Link copied', 'success')
                  }
                } catch { /* cancelled */ }
              }}
              aria-label="Share listing"
              className="w-7 h-7 flex items-center justify-center bg-white rounded-full shadow-sm text-ink hover:opacity-70 transition-opacity"
            >
              <ShareIcon size={14} />
            </button>
          </div>

          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
            {product.sold_out && (
              <span className="text-[10px] font-semibold tracking-wide bg-ink text-white px-2 py-1 rounded-full">SOLD OUT</span>
            )}
            {!product.sold_out && product.price === 0 && (
              <span className="text-[10px] font-semibold tracking-wide text-white px-2 py-1 rounded-full" style={{ background: 'var(--color-primary)' }}>FREE</span>
            )}
            {!product.sold_out && isOnSale && (
              <span className="text-[10px] font-semibold tracking-wide bg-ink text-white px-2 py-1 rounded-full">SALE</span>
            )}
            {!product.sold_out && !isOnSale && product.price > 0 && product.featured && (
              <span className="text-[10px] font-semibold tracking-wide bg-ink text-white px-2 py-1 rounded-full">FEATURED</span>
            )}
            {!product.sold_out && isNew && (
              <span className="text-[10px] font-semibold tracking-wide text-white px-2 py-1 rounded-full" style={{ background: 'var(--color-primary)' }}>NEW</span>
            )}
          </div>

          {!product.sold_out && (
            <div className="hidden md:block absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          )}
          <button
            onClick={(e) => { e.preventDefault(); setQuickViewOpen(true) }}
            className="hidden md:flex items-center justify-center gap-1.5 absolute bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] bg-white text-ink text-[11px] tracking-[0.1em] py-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-ink hover:text-white"
          >
            <MaterialIcon name="visibility" size={14} />
            QUICK VIEW
          </button>
        </div>

        <div className="p-3">
          <p className="text-[13px] font-medium leading-snug line-clamp-2 min-h-[2.2em] mb-1.5">{product.title}</p>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-1.5 text-[13px] min-w-0">
              {isOnSale ? (
                <>
                  <span className="text-[15px] font-semibold text-ink">${product.price.toFixed(2)}</span>
                  <span style={{ color: 'var(--color-madder)' }} className="line-through text-[12px]">${product.compare_at_price!.toFixed(2)}</span>
                </>
              ) : (
                <span className="text-[15px] font-semibold text-ink">{product.price === 0 ? 'Free' : `$${product.price.toFixed(2)}`}</span>
              )}
            </div>

            {!product.sold_out && (
              product.price === 0 ? (
                <button
                  onClick={downloadFree}
                  disabled={downloadingFree}
                  aria-label="Free — download now"
                  className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                  style={{ background: 'var(--color-accent)' }}
                >
                  <MaterialIcon name={downloadingFree ? 'hourglass_empty' : 'download'} size={16} />
                </button>
              ) : (
                <button
                  onClick={toggleCart}
                  aria-label={inCart ? 'Remove from cart' : 'Add to cart'}
                  className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full text-white hover:opacity-90 transition-opacity"
                  style={{ background: inCart ? 'var(--color-accent-hover)' : 'var(--color-accent)' }}
                >
                  <MaterialIcon name={inCart ? 'check' : 'shopping_bag'} size={16} />
                </button>
              )
            )}
          </div>
        </div>
      </Link>
      {quickViewOpen && <QuickView product={product} onClose={() => setQuickViewOpen(false)} />}
    </>
  )
}
