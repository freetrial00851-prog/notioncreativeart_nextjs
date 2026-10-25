'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Product, ReviewStats } from '../lib/types'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { startApiCheckout } from '../lib/lemonsqueezy'
import { allProductsUsePaddle } from '../lib/paddle'
import { SHOW_COMPARE_AT_PRICES } from '../lib/pricing'
import { downloadFreePattern } from '../lib/downloads'
import { isFreeProduct } from '../lib/product'
import { useToast } from '../context/ToastContext'
import { profileDisplayName } from '../lib/profileName'
import { deriveVariantUrl } from '../lib/imageVariants'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'
import { useSwipeCarousel } from '../lib/useSwipeCarousel'
import { ProductCardMeta } from './ProductCardMeta'
import { ProductTagPill } from './ProductTagPill'
import { skillLevelTagLabel } from '../lib/productCardMeta'

export function QuickView({
  product,
  reviewStats,
  onClose,
}: {
  product: Product
  reviewStats?: ReviewStats | null
  onClose: () => void
}) {
  const { user, profile } = useAuth()
  const { requireAuth, maybeOpenNewsletterPrompt, showBusyOverlay, hideBusyOverlay } = useUI()
  const { addToCart, removeFromCart, isInCart } = useCart()
  const { isWishlisted, toggleWishlist: toggleWishlistItem } = useWishlist()
  const { showToast } = useToast()
  const router = useRouter()
  const [activeImage, setActiveImage] = useState(0)
  const [downloadingFree, setDownloadingFree] = useState(false)
  const [buying, setBuying] = useState(false)
  const images = product.images ?? []
  const hasMultiple = images.length > 1
  const inCart = isInCart(product.id)
  const inWishlist = isWishlisted(product.id)
  const skillLabel = skillLevelTagLabel(product.skill_level)

  useBodyScrollLock(true)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const { containerRef: swipeContainerRef, slideRef: swipeSlideRef, go: swipeGo, handlers: swipeHandlers } = useSwipeCarousel({
    count: images.length,
    onNext: () => setActiveImage((i) => (i + 1) % Math.max(images.length, 1)),
    onPrev: () => setActiveImage((i) => (i - 1 + Math.max(images.length, 1)) % Math.max(images.length, 1)),
  })
  const slides = (() => {
    const n = images.length
    if (n === 0) return []
    const offsets = n >= 3 ? [-1, 0, 1] : n === 2 ? [0, 1] : [0]
    return offsets.map((off) => ({ off, idx: (activeImage + off + n) % n }))
  })()
  const next = () => swipeGo(1)
  const prev = () => swipeGo(-1)

  const handleBuy = async () => {
    if (isFreeProduct(product)) {
      if (downloadingFree) return
      setDownloadingFree(true)
      showBusyOverlay('download')
      const result = await downloadFreePattern(product.id, product.title, user?.id ?? null)
      hideBusyOverlay()
      setDownloadingFree(false)
      showToast(result.ok ? 'Downloading your pattern…' : (result.error ?? "This pattern's file isn't uploaded yet — please check back soon."), result.ok ? 'success' : 'error')
      if (result.ok) maybeOpenNewsletterPrompt()
      return
    }
    const guestOk = !user && (await allProductsUsePaddle([product.id]))
    if (!guestOk && !requireAuth({ type: 'buy', productId: product.id })) return
    if (buying) return
    setBuying(true)
    showBusyOverlay('checkout')
    const result = await startApiCheckout([product.id], {
      userId: user?.id,
      email: user?.email,
      name: profileDisplayName(profile) || undefined,
      billingCountry: profile?.billing_country,
      billingState: profile?.billing_state,
      billingZip: profile?.billing_zip,
    })
    if (result.ok && result.redirecting) {
      setTimeout(() => {
        hideBusyOverlay()
        setBuying(false)
      }, 15000)
      return
    }
    hideBusyOverlay()
    setBuying(false)
    if (!result.ok) showToast(result.error, 'error')
  }

  const toggleWishlist = async () => {
    const { added } = await toggleWishlistItem(product.id)
    if (added) {
      showToast('♡ Saved to wishlist', 'success', { label: 'View Wishlist', onClick: () => { onClose(); router.push('/account/wishlist') } })
    } else {
      showToast('Removed from wishlist', 'info')
    }
  }

  const toggleCart = async () => {
    if (isFreeProduct(product) || Number(product.price) === 0) return
    if (inCart) await removeFromCart(product.id)
    else await addToCart(product.id)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4 overscroll-none"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-3xl max-h-[85vh] bg-canvas border border-line rounded-2xl shadow-xl overflow-hidden flex flex-col md:grid md:grid-cols-2 md:items-stretch">
        <div
          className="relative bg-surface flex items-center justify-center shrink-0 p-3 md:p-4 min-h-[200px] max-h-[min(42vh,360px)] md:max-h-[85vh]"
          ref={swipeContainerRef}
          style={{ touchAction: 'pan-y' }}
          {...swipeHandlers}
        >
          <div ref={swipeSlideRef} className="absolute inset-0 will-change-transform">
            {slides.length > 0 ? (
              slides.map(({ idx, off }) => (
                <div key={idx} className="absolute inset-0 flex items-center justify-center p-3 md:p-4" style={{ transform: `translate3d(${off * 100}%,0,0)` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={images[idx]}
                    srcSet={`${images[idx]} 640w, ${deriveVariantUrl(images[idx], 'large')} 1000w`}
                    sizes="(max-width: 768px) 100vw, 480px"
                    alt={off === 0 ? product.title : ''}
                    aria-hidden={off !== 0 || undefined}
                    loading="eager"
                    decoding="async"
                    draggable={false}
                    className="max-h-full max-w-full h-auto w-auto select-none object-contain"
                  />
                </div>
              ))
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-ink-soft text-xs">No image yet</span>
            )}
          </div>

          {hasMultiple && (
            <>
              <button
                onClick={prev}
                aria-label="Previous image"
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-[3px] bg-canvas/90 flex items-center justify-center text-ink hover:bg-canvas"
              >
                ‹
              </button>
              <button
                onClick={next}
                aria-label="Next image"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-[3px] bg-canvas/90 flex items-center justify-center text-ink hover:bg-canvas"
              >
                ›
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`Image ${i + 1}`}
                    onClick={() => setActiveImage(i)}
                    className={`w-1.5 h-1.5 rounded-[3px] transition-colors ${i === activeImage ? 'bg-ink' : 'bg-ink/25'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="relative flex flex-col min-h-0 max-h-[85vh] p-5 md:p-6">
          <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 z-10 text-ink-soft hover:text-ink text-lg leading-none">✕</button>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
          {skillLabel && (
            <div className="mb-2">
              <ProductTagPill label={skillLabel} skillLevel={product.skill_level} compact />
            </div>
          )}
          <h2
            className="font-subheading font-semibold text-xl leading-snug pr-8 mb-2 overflow-hidden line-clamp-2 min-h-[2.75em]"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {product.title}
          </h2>
          <ProductCardMeta product={product} reviewStats={reviewStats} className="mb-3" />
          {!isFreeProduct(product) && Number(product.price) !== 0 && (
            <div className="flex items-center gap-3 mb-3">
              {SHOW_COMPARE_AT_PRICES && product.compare_at_price && product.compare_at_price > product.price ? (
                <>
                  <span className="text-xl font-bold text-deal">${product.price.toFixed(2)}</span>
                  <span className="line-through text-base font-medium text-sale">${product.compare_at_price.toFixed(2)}</span>
                </>
              ) : (
                <span className="text-base">${product.price.toFixed(2)}</span>
              )}
            </div>
          )}
          {product.description && (
            <p className="text-[13px] text-ink-soft leading-relaxed mb-2 whitespace-pre-line">
              {product.description}
            </p>
          )}
          </div>
          <div className="space-y-2 shrink-0 pt-2 border-t border-line/60">
            {product.sold_out ? (
              <div className="w-full py-3.5 border border-line rounded-[3px] text-center text-[12px] tracking-[0.12em] text-ink-soft">SOLD OUT</div>
            ) : (
              <button
                onClick={handleBuy}
                disabled={(isFreeProduct(product) && downloadingFree) || (product.price > 0 && buying)}
                className="w-full py-3 text-canvas text-[13px] font-semibold rounded-[3px] hover:opacity-90 transition-opacity disabled:opacity-60"
                style={{ background: isFreeProduct(product) ? 'var(--color-sale-green)' : 'var(--color-accent)' }}
              >
                {isFreeProduct(product) ? 'Download' : 'Buy now'}
              </button>
            )}
            <div className={product.sold_out || isFreeProduct(product) ? '' : 'grid grid-cols-2 gap-2'}>
              <button onClick={toggleWishlist} className="py-3 border border-ink text-[12px] tracking-[0.1em] hover:bg-surface transition-colors rounded-[3px] w-full">
                {inWishlist ? '♥ WISHLISTED' : '♡ WISHLIST'}
              </button>
              {!product.sold_out && product.price > 0 && (
                inCart ? (
                  <Link href="/cart" onClick={onClose} className="flex items-center justify-center py-3 border border-ink text-[12px] tracking-[0.1em] hover:bg-surface transition-colors rounded-[3px]">
                    ✓ IN CART
                  </Link>
                ) : (
                  <button onClick={toggleCart} className="py-3 border border-ink text-[12px] tracking-[0.1em] hover:bg-surface transition-colors rounded-[3px]">
                    + ADD TO CART
                  </button>
                )
              )}
            </div>
            <Link href={`/pattern/${product.slug}`} onClick={onClose} className="block text-center w-full py-3 border border-ink text-[12px] tracking-[0.1em] hover:bg-surface transition-colors rounded-[3px]">
              VIEW FULL DETAILS
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
