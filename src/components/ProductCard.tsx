'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Product, ReviewStats } from '../lib/types'
import { useUI } from '../context/UIContext'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useToast } from '../context/ToastContext'
import { skillLevelTagLabel, SKILL_PILL_STYLES } from '../lib/productCardMeta'
import { prefetchProduct } from '../lib/prefetchCache'
import { downloadFreePattern } from '../lib/downloads'
import { isFreeProduct } from '../lib/product'

const IMAGE_SHADOW = '0 2px 8px rgba(17,24,39,0.06)'
const IMAGE_SHADOW_HOVER = '0 6px 16px rgba(17,24,39,0.12)'

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path
        d="M12 20.15l-1.35-1.23C5.7 14.4 2.5 11.5 2.5 8.1 2.5 5.4 4.6 3.3 7.3 3.3c1.55 0 3.05.72 4.05 1.86C12.35 4.02 13.85 3.3 15.4 3.3c2.7 0 4.8 2.1 4.8 4.8 0 3.4-3.2 6.3-8.15 10.82L12 20.15z"
        fill={filled ? 'var(--color-sale)' : 'none'}
        stroke={filled ? 'var(--color-sale)' : 'var(--color-ink)'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--color-gold)" aria-hidden focusable="false">
      <path d="M12 2.8l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 16.7 6.6 19.6l1-6.1L3.2 9.2l6.1-.9L12 2.8z" />
    </svg>
  )
}

function BagPlusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path
        d="M6 8h12l-.7 11.2a2 2 0 0 1-2 1.8H8.7a2 2 0 0 1-2-1.8L6 8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 8V6.5A3 3 0 0 1 12 3.5v0a3 3 0 0 1 3 3V8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 12v4M10 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function DownloadArrowIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path d="M12 4v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 10l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 18h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path d="M5 12.5l5 5 9-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

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
  const [downloadingFree, setDownloadingFree] = useState(false)

  const inCart = isInCart(product.id)
  const inWishlist = isWishlisted(product.id)
  const href = `/pattern/${product.slug}`
  const isOnSale = product.price > 0 && !!product.compare_at_price && product.compare_at_price > product.price
  const badge = product.card_badge
  const skillLabel = skillLevelTagLabel(product.skill_level)
  const free = isFreeProduct(product)
  const showRating = !!reviewStats && reviewStats.reviewCount >= 1

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const { added } = await toggleWishlistItem(product.id)
    if (added) {
      showToast('Saved to wishlist', 'success', {
        label: 'View Wishlist',
        onClick: () => router.push('/account/wishlist'),
      })
    } else {
      showToast('Removed from wishlist', 'info')
    }
  }

  const toggleCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (inCart) await removeFromCart(product.id)
    else await addToCart(product.id)
  }

  const downloadFree = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (downloadingFree) return
    setDownloadingFree(true)
    showBusyOverlay('download')
    const result = await downloadFreePattern(product.id, product.title, user?.id ?? null)
    hideBusyOverlay()
    setDownloadingFree(false)
    showToast(
      result.ok
        ? 'Downloading your pattern…'
        : (result.error ?? "This pattern's file isn't uploaded yet — please check back soon."),
      result.ok ? 'success' : 'error',
    )
    if (result.ok) maybeOpenNewsletterPrompt()
  }

  const prefetch = () => prefetchProduct(product.slug)

  return (
    <article className="group/card flex h-full flex-col">
      {/* Image block */}
      <div
        className="relative aspect-square overflow-hidden rounded-[18px] border border-border bg-surface transition-[transform,box-shadow] duration-200 ease-out motion-reduce:transition-none [@media(hover:hover)]:group-hover/card:-translate-y-0.5 motion-reduce:[@media(hover:hover)]:group-hover/card:translate-y-0"
        style={{ boxShadow: IMAGE_SHADOW }}
        onMouseEnter={(e) => {
          prefetch()
          if (window.matchMedia('(hover: hover)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            e.currentTarget.style.boxShadow = IMAGE_SHADOW_HOVER
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = IMAGE_SHADOW
        }}
        onTouchStart={prefetch}
      >
        <Link href={href} className="absolute inset-0 z-0 block" aria-label={product.title} tabIndex={-1}>
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              priority={priority}
              className={`object-cover ${product.sold_out ? 'opacity-50' : ''}`}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-ink-soft text-xs">No image yet</span>
          )}
        </Link>

        {/* Top-left badges */}
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col items-start gap-1">
          {product.sold_out && (
            <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-extrabold tracking-[0.06em] text-white">
              SOLD OUT
            </span>
          )}
          {!product.sold_out && free && (
            <span className="rounded-full bg-free px-2.5 py-1 text-[11px] font-extrabold tracking-[0.06em] text-white">
              FREE
            </span>
          )}
          {!product.sold_out && badge === 'sale' && (
            <span className="rounded-full bg-sale px-2.5 py-1 text-[11px] font-extrabold tracking-[0.06em] text-white">
              SALE
            </span>
          )}
          {!product.sold_out && badge === 'new' && (
            <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-extrabold tracking-[0.06em] text-white">
              NEW
            </span>
          )}
          {!product.sold_out && badge === 'featured' && (
            <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-extrabold tracking-[0.06em] text-white">
              FEATURED
            </span>
          )}
        </div>

        {/* Top-right wishlist */}
        <button
          type="button"
          onClick={toggleWishlist}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={inWishlist}
          className="absolute right-3 top-3 z-10 inline-flex size-11 items-center justify-center rounded-full bg-white shadow-sm transition-opacity hover:opacity-90"
        >
          <HeartIcon filled={inWishlist} />
        </button>

        {/* Bottom-left skill */}
        {skillLabel && product.skill_level && (
          <span
            className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-semibold leading-none"
            style={SKILL_PILL_STYLES[product.skill_level]}
          >
            {skillLabel}
          </span>
        )}
      </div>

      {/* Info block */}
      <div className="mt-1.5 flex min-h-0 flex-1 flex-col gap-1.5">
        <h3 className="min-h-[2.6em] text-[14px] font-bold leading-snug text-ink">
          <Link
            href={href}
            onMouseEnter={prefetch}
            onTouchStart={prefetch}
            className="line-clamp-2 [@media(hover:hover)]:group-hover/card:text-primary [@media(hover:hover)]:group-hover/card:underline"
          >
            {product.title}
          </Link>
        </h3>

        {showRating && (
          <p className="flex items-center gap-1 text-[12px] text-muted">
            <StarIcon />
            <span>
              {reviewStats!.averageRating.toFixed(1)} ({reviewStats!.reviewCount})
            </span>
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-0.5">
          <div className="min-w-0">
            {free ? (
              <p className="text-base font-extrabold text-free md:text-lg">Free</p>
            ) : (
              <>
                <p className="text-base font-extrabold text-primary md:text-lg">
                  ${product.price.toFixed(2)}
                </p>
                {isOnSale && product.compare_at_price != null && (
                  <p className="text-[13px] text-muted line-through">
                    ${product.compare_at_price.toFixed(2)}
                  </p>
                )}
              </>
            )}
          </div>

          {!product.sold_out && (
            free ? (
              <button
                type="button"
                onClick={downloadFree}
                disabled={downloadingFree}
                aria-label={`Download ${product.title} free`}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors [@media(hover:hover)]:hover:bg-primary-hover active:scale-[0.96] disabled:opacity-60 motion-reduce:active:scale-100"
              >
                <DownloadArrowIcon />
              </button>
            ) : (
              <button
                type="button"
                onClick={toggleCart}
                aria-label={inCart ? `Remove ${product.title} from cart` : `Add ${product.title} to cart`}
                className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full text-white transition-colors active:scale-[0.96] motion-reduce:active:scale-100 ${
                  inCart ? 'bg-primary-hover' : 'bg-primary [@media(hover:hover)]:hover:bg-primary-hover'
                }`}
              >
                {inCart ? <CheckIcon /> : <BagPlusIcon />}
              </button>
            )
          )}
        </div>
      </div>
    </article>
  )
}
