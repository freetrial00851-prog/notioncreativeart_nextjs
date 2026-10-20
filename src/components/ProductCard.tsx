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
import { getStatusBadge, skillLevelTagLabel } from '../lib/productCardMeta'
import { prefetchProduct } from '../lib/prefetchCache'
import { downloadFreePattern } from '../lib/downloads'
import { isFreeProduct } from '../lib/product'


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
  const [heartPop, setHeartPop] = useState(0)
  const href = `/pattern/${product.slug}`
  const isOnSale = product.price > 0 && !!product.compare_at_price && product.compare_at_price > product.price
  const statusBadge = getStatusBadge(product)
  const skillLabel = skillLevelTagLabel(product.skill_level)
  const free = isFreeProduct(product)
  const showRating = !!reviewStats && reviewStats.reviewCount >= 1

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!inWishlist) setHeartPop((n) => n + 1) // pop instantly on press, not after the network round-trip
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

  const tile = tileColor(product.id)
  const addLabel = inCart ? `Remove ${product.title} from cart` : `Add ${product.title} to cart`
  const quickLabel = free ? (downloadingFree ? 'Preparing…' : 'Get free ↓') : inCart ? 'In your bag ✓' : 'Add to bag +'

  return (
    <article suppressHydrationWarning className="reveal card-lift group/card flex h-full flex-col">
      {/* Landscape card: the photo fills the whole tile (colour only shows while loading) */}
      <div
        className="relative aspect-[3/4] overflow-hidden rounded-[5px]"
        style={{ background: tile }}
        onMouseEnter={prefetch}
        onTouchStart={prefetch}
      >
        <Link href={href} className="press-card absolute inset-0 z-0 block" aria-label={product.title} tabIndex={-1}>
          {product.images?.[0] ? (
            <span className="absolute inset-0 block overflow-hidden">
              <Image
                src={product.images[0]}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                priority={priority}
                className={`img-fade object-cover transition-transform duration-500 [@media(hover:hover)]:group-hover/card:scale-[1.05] ${product.sold_out ? 'opacity-50' : ''}`}
              />
            </span>
          ) : (
            <span className="text-xs text-ink/60">No image yet</span>
          )}
        </Link>

        {statusBadge && (
          <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-[3px] bg-white px-[9px] py-[7px] text-[11px] font-bold uppercase leading-none tracking-[0.13em] text-ink">
            {STATUS_LABEL[statusBadge]}
          </span>
        )}

        <button
          type="button"
          onClick={toggleWishlist}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={inWishlist}
          className="absolute right-1 top-1 z-10 inline-flex size-11 items-center justify-center"
        >
          <span key={heartPop} className={`flex size-8 items-center justify-center rounded-[3px] bg-white ${heartPop > 0 ? 'animate-pop' : ''}`}>
            <HeartIcon filled={inWishlist} />
          </span>
        </button>

        {!product.sold_out && (
          <button
            type="button"
            onClick={free ? downloadFree : toggleCart}
            disabled={free && downloadingFree}
            aria-label={free ? `Download ${product.title} free` : addLabel}
            className="absolute bottom-2 right-2 z-10 inline-flex size-11 items-center justify-center rounded-[3px] bg-navy text-[11px] font-bold uppercase tracking-[0.12em] text-white transition-[opacity,transform,background-color] hover:bg-violet focus-visible:translate-y-0 focus-visible:opacity-100 disabled:opacity-60 md:inset-x-3 md:bottom-3 md:right-3 md:size-auto md:min-h-11 md:translate-y-1 md:px-3 md:opacity-0 md:group-hover/card:translate-y-0 md:group-hover/card:opacity-100"
          >
            <span aria-hidden className="text-[18px] leading-none md:hidden">{free ? (downloadingFree ? '…' : '↓') : inCart ? '✓' : '+'}</span>
            <span className="hidden md:inline">{quickLabel}</span>
          </button>
        )}
      </div>

      <div className="px-px pb-1 pt-[15px]">
        {skillLabel && (
          <p className="mb-[7px] text-[11px] font-bold uppercase leading-none tracking-[0.13em] text-violet">{skillLabel}</p>
        )}
        <h3 className="mb-[9px] font-heading text-[17px] font-normal leading-[1.3] text-ink">
          <Link
            href={href}
            onMouseEnter={prefetch}
            onTouchStart={prefetch}
            title={product.title}
            className="block truncate transition-colors [@media(hover:hover)]:group-hover/card:text-violet"
          >
            {product.title}
          </Link>
        </h3>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[18px] font-extrabold leading-none text-ink">
          {free ? (
            <span className="font-extrabold text-ink">Free</span>
          ) : (
            <>
              <span className={isOnSale ? 'text-deal' : undefined}>${product.price.toFixed(2)}</span>
              {isOnSale && product.compare_at_price != null && (
                <del className="text-[14px] font-semibold text-sale">${product.compare_at_price.toFixed(2)}</del>
              )}
            </>
          )}
          {showRating && (
            <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-muted">
              <StarIcon />
              {reviewStats!.averageRating.toFixed(1)} ({reviewStats!.reviewCount})
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

const TILE_COLORS = ['#F2F2F2', '#EDEDED', '#F5F5F5', '#EBEBEB'] as const

/** Stable colour per product (same card never changes colour between renders/pages). */
function tileColor(id: string): string {
  // FNV-1a mix so near-identical ids (uuids sharing prefixes) still spread across all four colours.
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  h ^= h >>> 15
  h = Math.imul(h, 2246822507)
  h ^= h >>> 13
  return TILE_COLORS[(h >>> 0) % TILE_COLORS.length]
}

const STATUS_LABEL: Record<NonNullable<ReturnType<typeof getStatusBadge>>, string> = {
  sold_out: 'Sold out',
  sale: 'Sale',
  new: 'New arrival',
  featured: 'Bestseller',
}
