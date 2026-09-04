'use client'

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
import { ProductTagPill } from './ProductTagPill'
import { skillLevelTagLabel } from '../lib/productCardMeta'
import { prefetchProduct } from '../lib/prefetchCache'
import { deriveVariantUrl } from '../lib/imageVariants'
import { downloadFreePattern } from '../lib/downloads'
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
  const skillLabel = skillLevelTagLabel(product.skill_level)

  return (
    <>
      <Link
        href={`/pattern/${product.slug}`}
        className="group block bg-white rounded-lg border border-line overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow"
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
          </div>

          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
            {product.sold_out && (
              <span className="text-[10px] font-semibold tracking-wide bg-ink text-white px-2 py-1 rounded-full">SOLD OUT</span>
            )}
            {!product.sold_out && product.price === 0 && (
              <span className="text-[10px] font-semibold tracking-wide text-white px-2 py-1 rounded-full" style={{ background: 'var(--color-primary)' }}>FREE</span>
            )}
            {!product.sold_out && badge === 'sale' && (
              <span className="text-[10px] font-semibold tracking-wide bg-ink text-white px-2 py-1 rounded-full">SALE</span>
            )}
            {!product.sold_out && badge === 'new' && (
              <span className="text-[10px] font-semibold tracking-wide text-white px-2 py-1 rounded-full" style={{ background: 'var(--color-primary)' }}>NEW</span>
            )}
            {!product.sold_out && badge === 'featured' && (
              <span className="text-[10px] font-semibold tracking-wide bg-ink text-white px-2 py-1 rounded-full">FEATURED</span>
            )}
          </div>

          {!product.sold_out && (
            <div className="hidden md:block absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          )}
          <button
            onClick={(e) => { e.preventDefault(); setQuickViewOpen(true) }}
            className="hidden md:flex items-center justify-center gap-1.5 absolute bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] bg-white text-ink text-[11px] tracking-[0.1em] py-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-ink hover:text-white"
          >
            <MaterialIcon name="visibility" size={14} />
            QUICK VIEW
          </button>
        </div>

        <div className="p-3">
          {skillLabel && (
            <div className="mb-1.5">
              <ProductTagPill label={skillLabel} skillLevel={product.skill_level} compact />
            </div>
          )}
          <p className="text-[13px] font-medium leading-snug line-clamp-2 min-h-[2.75em] mb-1.5">{product.title}</p>
          <ProductCardMeta product={product} reviewStats={reviewStats} className="mb-1" />
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
                  aria-label="Download free"
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
      {quickViewOpen && (
        <QuickView product={product} reviewStats={reviewStats} onClose={() => setQuickViewOpen(false)} />
      )}
    </>
  )
}
