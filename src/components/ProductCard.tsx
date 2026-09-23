'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Product, ReviewStats } from '../lib/types'
import { useUI } from '../context/UIContext'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useToast } from '../context/ToastContext'
import { useState } from 'react'
import { QuickView } from './QuickView'
import { ProductCardMeta } from './ProductCardMeta'
import { prefetchProduct } from '../lib/prefetchCache'
import { downloadFreePattern } from '../lib/downloads'
import { isFreeProduct } from '../lib/product'
import { SITE_NAME } from '../lib/seo'
import { MaterialIcon } from './MaterialIcon'
import { FavoriteIcon } from './icons'

export function ProductCard({
  product,
  priority = false,
  reviewStats,
}: {
  product: Product
  priority?: boolean
  reviewStats?: ReviewStats | null
}) {
  const { maybeOpenNewsletterPrompt, showBusyOverlay, hideBusyOverlay } = useUI()
  const { user } = useAuth()
  const { addToCart, removeFromCart, isInCart } = useCart()
  const { isWishlisted, toggleWishlist: toggleWishlistItem } = useWishlist()
  const { showToast } = useToast()
  const router = useRouter()
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const [downloadingFree, setDownloadingFree] = useState(false)
  const inCart = isInCart(product.id)
  const inWishlist = isWishlisted(product.id)

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    const { added } = await toggleWishlistItem(product.id)
    if (added) {
      showToast('♡ Saved to wishlist', 'success', { label: 'View Wishlist', onClick: () => router.push('/account/wishlist') })
    } else {
      showToast('Removed from wishlist', 'info')
    }
  }

  const toggleCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (inCart) await removeFromCart(product.id)
    else await addToCart(product.id)
  }

  const downloadFree = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (downloadingFree) return
    setDownloadingFree(true)
    showBusyOverlay('download')
    const result = await downloadFreePattern(product.id, product.title, user?.id ?? null)
    hideBusyOverlay()
    setDownloadingFree(false)
    showToast(result.ok ? 'Downloading your pattern…' : (result.error ?? "This pattern's file isn't uploaded yet — please check back soon."), result.ok ? 'success' : 'error')
    if (result.ok) maybeOpenNewsletterPrompt()
  }

  const isOnSale = product.price > 0 && !!product.compare_at_price && product.compare_at_price > product.price
  const badge = product.card_badge

  return (
    <>
      <Link
        href={`/pattern/${product.slug}`}
        className="group flex h-full flex-col"
        onMouseEnter={() => prefetchProduct(product.slug)}
        onTouchStart={() => prefetchProduct(product.slug)}
      >
        <div className="relative aspect-square bg-surface overflow-hidden rounded-lg">
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 50vw, 20vw"
              priority={priority}
              className={`object-cover transition-transform duration-500 group-hover:scale-[1.03] ${product.sold_out ? 'opacity-50' : ''}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-soft text-caption">No image yet</div>
          )}

          <div className="absolute top-2 right-2 z-[1]">
            <button
              onClick={toggleWishlist}
              aria-label="Add to wishlist"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors"
            >
              <FavoriteIcon
                size={15}
                filled={inWishlist}
                color={inWishlist ? 'var(--color-madder)' : 'var(--color-ink)'}
              />
            </button>
          </div>

          <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-[1]">
            {product.sold_out && (
              <span className="text-[10px] font-semibold tracking-wide bg-ink text-white px-2 py-0.5 rounded">SOLD OUT</span>
            )}
            {isFreeProduct(product) && (
              <span className="text-[10px] font-semibold tracking-wide text-white px-2 py-0.5 rounded" style={{ background: 'var(--color-accent)' }}>FREE</span>
            )}
            {!product.sold_out && badge === 'sale' && (
              <span className="text-[10px] font-semibold tracking-wide bg-ink text-white px-2 py-0.5 rounded">SALE</span>
            )}
            {!product.sold_out && badge === 'new' && (
              <span className="text-[10px] font-semibold tracking-wide text-white px-2 py-0.5 rounded" style={{ background: 'var(--color-accent)' }}>NEW</span>
            )}
            {!product.sold_out && badge === 'featured' && (
              <span className="text-[10px] font-semibold tracking-wide bg-ink text-white px-2 py-0.5 rounded">FEATURED</span>
            )}
          </div>

          {!product.sold_out && (
            <button
              onClick={(e) => { e.preventDefault(); setQuickViewOpen(true) }}
              className="hidden md:flex items-center justify-center gap-1.5 absolute bottom-2 left-1/2 -translate-x-1/2 w-[calc(100%-16px)] bg-white text-ink text-caption font-semibold py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-ink hover:text-white"
            >
              <MaterialIcon name="visibility" size={14} />
              Quick view
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col pt-2 pb-1 gap-0.5 min-w-0">
          <p className="text-caption text-ink-soft truncate">{SITE_NAME}</p>
          <p className="text-body font-normal text-ink leading-snug line-clamp-2">{product.title}</p>
          <ProductCardMeta product={product} reviewStats={reviewStats} className="mt-0.5" />

          {isFreeProduct(product) || Number(product.price) === 0 ? (
            <p className="text-body font-bold text-ink mt-0.5">Free</p>
          ) : (
            <div className="flex items-baseline gap-1.5 mt-0.5 min-w-0">
              <span className="text-body font-bold text-ink">${product.price.toFixed(2)}</span>
              {isOnSale && (
                <span className="text-caption text-ink-soft line-through">${product.compare_at_price!.toFixed(2)}</span>
              )}
            </div>
          )}

          {!product.sold_out && (
            <div className="mt-auto pt-2">
              {isFreeProduct(product) ? (
                <button
                  onClick={downloadFree}
                  disabled={downloadingFree}
                  aria-label="Download"
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-full py-2 text-caption font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                  style={{ background: 'var(--color-accent)' }}
                >
                  <MaterialIcon name={downloadingFree ? 'hourglass_empty' : 'download'} size={14} />
                  {downloadingFree ? 'Downloading…' : 'Download'}
                </button>
              ) : (
                <button
                  onClick={toggleCart}
                  aria-label={inCart ? 'Remove from cart' : 'Add to cart'}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-full py-2 text-caption font-semibold border border-line bg-white text-ink hover:border-ink transition-colors"
                >
                  <MaterialIcon name={inCart ? 'check' : 'shopping_bag'} size={14} />
                  {inCart ? 'In Cart' : 'Add to Cart'}
                </button>
              )}
            </div>
          )}
        </div>
      </Link>
      {quickViewOpen && (
        <QuickView product={product} reviewStats={reviewStats} onClose={() => setQuickViewOpen(false)} />
      )}
    </>
  )
}
