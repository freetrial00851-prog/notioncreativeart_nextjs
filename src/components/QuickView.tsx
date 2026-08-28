'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Product } from '../lib/types'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { startApiCheckout } from '../lib/lemonsqueezy'
import { downloadFreePattern } from '../lib/downloads'
import { useToast } from '../context/ToastContext'
import { profileDisplayName } from '../lib/profileName'
import { deriveVariantUrl } from '../lib/imageVariants'

export function QuickView({ product, onClose }: { product: Product; onClose: () => void }) {
  const { user, profile } = useAuth()
  const { requireAuth, maybeOpenNewsletterPrompt, showBusyOverlay, hideBusyOverlay } = useUI()
  const { addToCart, removeFromCart, isInCart } = useCart()
  const { isWishlisted, toggleWishlist: toggleWishlistItem } = useWishlist()
  const { showToast } = useToast()
  const router = useRouter()
  const [activeImage, setActiveImage] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [downloadingFree, setDownloadingFree] = useState(false)
  const [buying, setBuying] = useState(false)
  const images = product.images ?? []
  const hasMultiple = images.length > 1
  const inCart = isInCart(product.id)
  const inWishlist = isWishlisted(product.id)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const next = () => setActiveImage((i) => (i + 1) % images.length)
  const prev = () => setActiveImage((i) => (i - 1 + images.length) % images.length)

  const handleBuy = async () => {
    if (product.price === 0) {
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
    if (!requireAuth({ type: 'buy', productId: product.id })) return
    if (buying) return
    setBuying(true)
    showBusyOverlay('checkout')
    const result = await startApiCheckout([product.id], {
      userId: user!.id,
      email: user!.email,
      name: profileDisplayName(profile) || undefined,
      billingCountry: profile?.billing_country,
      billingState: profile?.billing_state,
      billingZip: profile?.billing_zip,
    })
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
    if (product.price === 0) return
    if (inCart) await removeFromCart(product.id)
    else await addToCart(product.id)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-3xl bg-canvas border border-line grid md:grid-cols-2 max-h-[85vh] overflow-y-auto">
        <div
          className="relative bg-surface flex items-center justify-center aspect-square md:aspect-auto rounded-xl md:rounded-none overflow-hidden"
          onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStartX === null) return
            const delta = e.changedTouches[0].clientX - touchStartX
            if (Math.abs(delta) > 50 && hasMultiple) delta < 0 ? next() : prev()
            setTouchStartX(null)
          }}
        >
          {images[activeImage] ? (
            <img
              src={images[activeImage]}
              srcSet={`${images[activeImage]} 640w, ${deriveVariantUrl(images[activeImage], 'large')} 1000w`}
              sizes="(max-width: 768px) 100vw, 480px"
              alt={product.title}
              loading="eager"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-ink-soft text-xs">No image yet</span>
          )}

          {hasMultiple && (
            <>
              <button
                onClick={prev}
                aria-label="Previous image"
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-canvas/90 flex items-center justify-center text-ink hover:bg-canvas"
              >
                ‹
              </button>
              <button
                onClick={next}
                aria-label="Next image"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-canvas/90 flex items-center justify-center text-ink hover:bg-canvas"
              >
                ›
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`Image ${i + 1}`}
                    onClick={() => setActiveImage(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === activeImage ? 'bg-ink' : 'bg-ink/25'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-8 relative">
          <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-ink-soft hover:text-ink text-lg leading-none">✕</button>
          {product.skill_level && <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-3 uppercase">{product.skill_level}</p>}
          <h2 className="font-subheading font-semibold text-2xl mb-3">{product.title}</h2>
          <div className="flex items-center gap-3 mb-6">
            {product.price > 0 && product.compare_at_price && product.compare_at_price > product.price ? (
              <>
                <span className="text-base font-semibold text-ink">${product.price.toFixed(2)}</span>
                <span style={{ color: 'var(--color-madder)' }} className="line-through text-sm">${product.compare_at_price.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-base">{product.price === 0 ? 'Free' : `$${product.price.toFixed(2)}`}</span>
            )}
          </div>
          {product.description && (
            <p className="text-[14px] text-ink-soft leading-relaxed mb-6 line-clamp-4 whitespace-pre-line">{product.description}</p>
          )}
          <div className="space-y-3">
            {product.sold_out ? (
              <div className="w-full py-3.5 border border-line rounded-full text-center text-[12px] tracking-[0.12em] text-ink-soft">SOLD OUT</div>
            ) : (
              <button
                onClick={handleBuy}
                disabled={(product.price === 0 && downloadingFree) || (product.price > 0 && buying)}
                className="w-full py-3.5 bg-ink text-canvas text-[13px] font-semibold hover:opacity-85 transition-opacity rounded-full disabled:opacity-60"
              >
                {product.price === 0 ? 'Download free' : 'Buy now — instant download'}
              </button>
            )}
            <div className={product.sold_out || product.price === 0 ? '' : 'grid grid-cols-2 gap-3'}>
              <button onClick={toggleWishlist} className="py-3.5 border border-ink text-[12px] tracking-[0.1em] hover:bg-surface transition-colors rounded-full w-full">
                {inWishlist ? '♥ WISHLISTED' : '♡ WISHLIST'}
              </button>
              {!product.sold_out && product.price > 0 && (
                inCart ? (
                  <Link href="/cart" onClick={onClose} className="flex items-center justify-center py-3.5 border border-ink text-[12px] tracking-[0.1em] hover:bg-surface transition-colors rounded-full">
                    ✓ IN CART
                  </Link>
                ) : (
                  <button onClick={toggleCart} className="py-3.5 border border-ink text-[12px] tracking-[0.1em] hover:bg-surface transition-colors rounded-full">
                    + ADD TO CART
                  </button>
                )
              )}
            </div>
            <Link href={`/pattern/${product.slug}`} onClick={onClose} className="block text-center w-full py-3.5 border border-ink text-[12px] tracking-[0.12em] hover:bg-surface transition-colors rounded-full">
              VIEW FULL DETAILS
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
