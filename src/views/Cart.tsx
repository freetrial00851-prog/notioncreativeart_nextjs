'use client'

import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { useCart } from '../context/CartContext'
import { setPendingCheckout } from '../lib/guestStorage'
import { deriveVariantUrl } from '../lib/imageVariants'
import { MaterialIcon } from '../components/MaterialIcon'
import { CartIcon } from '../components/icons'
import { ContentSkeleton } from '../components/Skeleton'

export function Cart() {
  const { user, loading: authLoading } = useAuth()
  const { requireAuth } = useUI()
  const { items, loading, removeFromCart, clearCart, checkingOut, checkoutError, checkout } = useCart()

  if (authLoading || loading) return <ContentSkeleton />

  const total = items.reduce((sum, i) => sum + (i.product?.price ?? 0), 0)

  const handleCheckout = () => {
    if (!user) {
      setPendingCheckout(true)
      requireAuth()
      return
    }
    void checkout()
  }

  if (items.length === 0) {
    return (
      <div className="max-w-site w-full mx-auto px-6 py-32 text-center">
        <p className="font-subheading text-2xl mb-4">Your cart is empty.</p>
        <Link href="/shop" className="text-[12px] tracking-[0.12em] border-b border-ink pb-1">SHOP ALL PATTERNS →</Link>
      </div>
    )
  }

  return (
    <div className="max-w-site w-full mx-auto px-6 md:px-16 py-10">
      <nav className="flex items-center gap-2 text-[12px] text-ink-soft mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <span className="text-ink">Your Cart</span>
      </nav>

      <div className="flex items-start justify-between mb-10 flex-wrap gap-3">
        <div>
          <p className="text-[11px] tracking-[0.15em] font-medium mb-2" style={{ color: 'var(--color-sale-green)' }}>YOUR SHOPPING CART</p>
          <h1 className="font-display font-semibold text-4xl mb-2">Cart ({items.length})</h1>
          <p className="text-[13px] text-ink-soft">Your selected crochet patterns, ready for checkout.</p>
        </div>
        <Link href="/shop" className="flex items-center gap-1.5 text-[13px] font-medium hover:opacity-80" style={{ color: 'var(--color-sale-green)' }}>
          <ArrowLeftIcon /> Continue Shopping
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
        <div>
          <div className="bg-white border border-line rounded-2xl overflow-hidden">
            <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_auto_auto] gap-4 px-6 py-3 border-b border-line text-[11px] tracking-[0.1em] text-ink-soft">
              <span>PRODUCT</span>
              <span>PRICE</span>
              <span>ACTION</span>
            </div>
            <div className="divide-y divide-line">
              {items.map((item) => (
                <div key={item.product_id} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_auto] gap-4 items-center p-6">
                  <div className="flex items-center gap-4 min-w-0">
                    <Link href={item.product ? `/pattern/${item.product.slug}` : '#'} className="w-24 h-24 shrink-0 bg-surface overflow-hidden rounded-lg">
                      {item.product?.images?.[0] && <img src={deriveVariantUrl(item.product.images[0], 'thumb')} alt={item.product.title} className="w-full h-full object-cover" />}
                    </Link>
                    <div className="min-w-0">
                      <p className="font-subheading text-[16px] font-medium truncate">{item.product?.title}</p>
                      <span className="inline-block text-[11px] font-medium mt-1.5 px-2.5 py-0.5 rounded-full" style={{ background: 'var(--color-surface)', color: 'var(--color-sale-green)' }}>
                        Digital PDF Pattern
                      </span>
                      <p className="flex items-center gap-1.5 text-[12px] text-ink-soft mt-2">
                        <DownloadIcon /> Instant Digital Download
                      </p>
                      <p className="text-[15px] font-medium mt-2 sm:hidden">
                        {item.product?.price === 0 ? 'Free' : `$${(item.product?.price ?? 0).toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                  <span className="hidden sm:block text-[15px] font-medium justify-self-end">
                    {item.product?.price === 0 ? 'Free' : `$${(item.product?.price ?? 0).toFixed(2)}`}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    aria-label="Remove item"
                    className="flex flex-col items-center gap-1 text-[11px] text-ink-soft hover:text-madder justify-self-end"
                  >
                    <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
                      <TrashIcon />
                    </span>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={clearCart}
            className="flex items-center gap-2 mt-5 text-[13px] font-medium hover:opacity-80"
            style={{ color: 'var(--color-madder)' }}
          >
            <TrashIcon /> Clear Cart
            <span className="text-ink-soft font-normal">This will remove all items from your cart.</span>
          </button>
        </div>

        <div className="bg-white border border-line rounded-2xl p-6 lg:sticky lg:top-24">
          <p className="text-[11px] tracking-[0.15em] font-medium mb-5" style={{ color: 'var(--color-accent)' }}>ORDER SUMMARY</p>
          <div className="flex items-center justify-between text-[14px] mb-3">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-[16px] font-semibold pt-3 border-t border-line mb-5">
            <span>Total</span>
            <span className="text-ink">${total.toFixed(2)}</span>
          </div>

          {checkoutError && <p className="text-madder text-[12px] mb-3">{checkoutError}</p>}

          <button
            onClick={handleCheckout}
            disabled={checkingOut}
            aria-busy={checkingOut}
            className="w-full py-4 flex items-center justify-center gap-2 text-white text-[12px] tracking-[0.12em] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-wait"
            style={{ background: 'var(--color-sale-green)' }}
          >
            <CartIcon size={14} /> CHECKOUT — ${total.toFixed(2)}
          </button>

          {!user && (
            <p className="text-[11px] text-ink-soft text-center mt-3">
              Sign in to complete checkout — your cart will be saved to your account.
            </p>
          )}

          <div className="flex items-center gap-3 rounded-xl px-4 py-3.5 mt-4" style={{ background: 'var(--color-surface)' }}>
            <DigitalIcon />
            <div className="min-w-0">
              <p className="text-[12px] font-semibold">DIGITAL PRODUCTS</p>
              <p className="text-[11px] text-ink-soft mt-0.5">Instant access after successful purchase. PDF patterns — no physical item is shipped.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6 text-center">
            {[
              { icon: <DownloadIcon large />, title: 'Instant Access', sub: 'Download immediately after purchase' },
              { icon: <ShieldIcon />, title: 'Secure Checkout', sub: 'Safe and encrypted payments' },
              { icon: <HeartIcon />, title: 'Made for Makers', sub: 'Patterns designed with love' },
            ].map((b) => (
              <div key={b.title}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-2" style={{ background: 'var(--color-surface)' }}>
                  {b.icon}
                </div>
                <p className="text-[11px] font-semibold leading-tight">{b.title}</p>
                <p className="text-[10px] text-ink-soft mt-1 leading-tight">{b.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ArrowLeftIcon() {
  return <MaterialIcon name="arrow_back" size={14} />
}
function TrashIcon() {
  return <MaterialIcon name="delete" size={16} />
}
function DownloadIcon({ large = false }: { large?: boolean }) {
  return <MaterialIcon name="download" size={large ? 18 : 13} color="var(--color-sale-green)" />
}
function DigitalIcon() {
  return <MaterialIcon name="download" size={20} color="var(--color-sale-green)" />
}
function ShieldIcon() {
  return <MaterialIcon name="verified_user" size={18} color="var(--color-sale-green)" />
}
function HeartIcon() {
  return <MaterialIcon name="favorite" size={18} color="var(--color-sale-green)" />
}
