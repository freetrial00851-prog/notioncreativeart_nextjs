'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { startCheckout } from '../lib/lemonsqueezy'
import { getPrefetchedProduct } from '../lib/prefetchCache'
import { deriveVariantUrl } from '../lib/imageVariants'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { claimAndDownloadFreePattern } from '../lib/downloads'
import { ProductCard } from '../components/ProductCard'
import { MaterialIcon } from '../components/MaterialIcon'
import { NewsletterBanner } from '../components/NewsletterBanner'
import type { Product } from '../lib/types'

type DescriptionBlock = { type: 'heading' | 'check' | 'warning' | 'paragraph'; content: string }

function formatDescription(text: string): DescriptionBlock[] {
  const blocks: DescriptionBlock[] = []
  let buffer: string[] = []
  const flush = () => {
    if (buffer.length) {
      blocks.push({ type: 'paragraph', content: buffer.join(' ') })
      buffer = []
    }
  }
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) { flush(); continue }
    if (/^[_\-─—]{3,}$/.test(line)) continue // divider line — drop, headings get their own styled rule instead
    if (/^[✓✔]\s*/.test(line)) { flush(); blocks.push({ type: 'check', content: line.replace(/^[✓✔]\s*/, '') }); continue }
    if (/^[⚠️!]\s*(note|warning)/i.test(line) || /^⚠/.test(line)) { flush(); blocks.push({ type: 'warning', content: line.replace(/^[⚠️!]\s*/, '') }); continue }
    // Short ALL-CAPS line with no sentence punctuation reads as a section heading (e.g. "WHAT'S INCLUDED", "SKILL LEVEL")
    if (line.length <= 40 && !/[.!?]$/.test(line) && /^[A-Z0-9][A-Z0-9\s&'.,]*$/.test(line) && line === line.toUpperCase() && /[A-Z]{2}/.test(line)) {
      flush()
      blocks.push({ type: 'heading', content: line })
      continue
    }
    buffer.push(line)
  }
  flush()
  return blocks
}

function DescriptionBlocks({ text }: { text: string }) {
  return (
    <div className="space-y-1">
      {formatDescription(text).map((b, i) => {
        if (b.type === 'heading') {
          return <p key={i} className="text-[11px] tracking-[0.15em] text-ink-soft font-semibold mt-6 mb-2 pb-2 border-b border-line first:mt-0">{b.content}</p>
        }
        if (b.type === 'check') {
          return <p key={i} className="flex items-start gap-2 text-[13px] text-ink-soft leading-relaxed"><span className="mt-0.5"><CheckIcon /></span><span>{b.content}</span></p>
        }
        if (b.type === 'warning') {
          return <p key={i} className="text-[12px] text-ink-soft italic mt-5 pt-4 border-t border-line">⚠ {b.content}</p>
        }
        return <p key={i} className="text-[14px] text-ink-soft leading-relaxed mb-1">{b.content}</p>
      })}
    </div>
  )
}

type Tab = 'description' | 'included' | 'materials' | 'details' | 'download'

export function ProductDetail() {
  const params = useParams()
  const slug = typeof params?.slug === 'string' ? params.slug : undefined
  const { user, profile } = useAuth()
  const { requireAuth } = useUI()
  const router = useRouter()
  const { addToCart, removeFromCart, isInCart } = useCart()
  const { showToast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [category, setCategory] = useState<{ name: string; slug: string } | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [activeImage, setActiveImage] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [showStickyBar, setShowStickyBar] = useState(false)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('description')
  const [openAccordion, setOpenAccordion] = useState<Tab | null>('description')
  const buyButtonRef = useRef<HTMLDivElement>(null)
  const [owned, setOwned] = useState(false)
  const [inWishlist, setInWishlist] = useState(false)
  const [loading, setLoading] = useState(true)
  const [downloadingFree, setDownloadingFree] = useState(false)
  const [buying, setBuying] = useState(false)

  const [unavailable, setUnavailable] = useState(false)
  const [purchaseCount, setPurchaseCount] = useState(0)
  const [alsoBought, setAlsoBought] = useState<Product[]>([])

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setUnavailable(false)
    const prefetched = getPrefetchedProduct(slug)
    const fetchProduct = prefetched ?? supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .eq('active', true)
      .single()
      .then(({ data }) => data as Product | null)

    fetchProduct.then(async (data) => {
      setProduct(data)
      if (!data) {
        // Distinguish "never existed" from "existed but is now inactive/deleted" —
        // the second case gets its own message so a returning customer isn't left
        // wondering whether they mistyped a URL.
        const { data: everExisted } = await supabase.rpc('product_slug_ever_existed', { check_slug: slug })
        setUnavailable(!!everExisted)
      }
      setLoading(false)
      setActiveTab('description')
      setActiveImage(0)
    })
  }, [slug])

  useEffect(() => {
    if (!product?.category_id) { setCategory(null); return }
    supabase.from('categories').select('name, slug').eq('id', product.category_id).maybeSingle()
      .then(({ data }) => setCategory(data as { name: string; slug: string } | null))
  }, [product?.category_id])

  useEffect(() => {
    if (!product) { setRelated([]); return }
    const TARGET = 8
    ;(async () => {
      let items: Product[] = []
      if (product.category_id) {
        const { data } = await supabase.from('products').select('*').eq('active', true).eq('category_id', product.category_id).neq('id', product.id).limit(TARGET)
        items = (data as Product[]) ?? []
      }
      if (items.length < TARGET) {
        const excludeIds = [product.id, ...items.map((p) => p.id)]
        const { data } = await supabase.from('products').select('*').eq('active', true).not('id', 'in', `(${excludeIds.join(',')})`).order('created_at', { ascending: false }).limit(TARGET - items.length)
        items = [...items, ...((data as Product[]) ?? [])]
      }
      setRelated(items)
    })()
  }, [product])

  // Real trust signal — how many people have actually downloaded this pattern.
  // Only shown once it's a meaningful number (see render below) rather than
  // a lonely "1 download".
  useEffect(() => {
    if (!product) { setPurchaseCount(0); return }
    supabase.rpc('get_purchase_count', { target_product_id: product.id }).then(({ data }) => setPurchaseCount(data ?? 0))
  }, [product])

  // Real cross-sell — products that have actually shown up in the same order
  // as this one (order co-occurrence), not a guess. Uses a security-definer
  // RPC since a regular customer's RLS access only covers their own orders —
  // this needs to look across everyone's, but only ever gets back product
  // ids, never other customers' order details. Naturally empty for a
  // product that's never been bought alongside anything else, in which case
  // the section just doesn't render.
  useEffect(() => {
    if (!product) { setAlsoBought([]); return }
    supabase.rpc('get_also_bought', { target_product_id: product.id, result_limit: 8 }).then(async ({ data: ids }) => {
      if (!ids || ids.length === 0) { setAlsoBought([]); return }
      const { data: items } = await supabase.from('products').select('*').eq('active', true).in('id', ids)
      const byId = new Map((items as Product[] ?? []).map((p) => [p.id, p]))
      setAlsoBought((ids as string[]).map((id) => byId.get(id)).filter((p): p is Product => !!p))
    })
  }, [product])

  useEffect(() => {
    if (!user || !product) return
    supabase
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .limit(1)
      .then(({ data }) => setOwned(!!data && data.length > 0))
    supabase
      .from('wishlist')
      .select('product_id')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .maybeSingle()
      .then(({ data }) => setInWishlist(!!data))
  }, [user, product])

  useEffect(() => {
    if (!buyButtonRef.current) return
    const observer = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting), { threshold: 0 })
    observer.observe(buyButtonRef.current)
    return () => observer.disconnect()
  }, [product])

  useEffect(() => {
    if (!zoomOpen) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setZoomOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [zoomOpen])
useEffect(() => {
    if (!product) return
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      description: product.description ?? undefined,
      image: product.images?.[0],
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'USD',
        availability: product.sold_out ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
        url: `https://notioncreativeart.com/pattern/${slug}`,
      },
    })
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [product, slug])

  if (loading) return <div className="max-w-[1400px] mx-auto px-8 py-32 text-center text-ink-soft text-sm">Loading…</div>
  if (!product) return <div className="max-w-[1400px] mx-auto px-8 py-32 text-center">
    {unavailable ? (
      <>
        <p className="font-subheading text-2xl mb-3">This pattern is no longer available.</p>
        <p className="text-ink-soft text-[13px] mb-6 max-w-sm mx-auto">The maker has taken this listing down. If you already own it, it's still in your account under Downloads.</p>
      </>
    ) : (
      <p className="font-subheading text-2xl mb-4">Pattern not found.</p>
    )}
    <Link href="/shop" className="text-[12px] tracking-[0.12em] border-b border-ink pb-1">BACK TO SHOP →</Link>
  </div>

  const handleBuy = async () => {
    if (!requireAuth({ type: 'buy', productId: product.id })) return
    if (product.price === 0) {
      setDownloadingFree(true)
      const ok = await claimAndDownloadFreePattern(user!.id, product.id, product.title)
      setDownloadingFree(false)
      showToast(ok ? 'Downloading your pattern…' : "This pattern's file isn't uploaded yet — please check back soon.", ok ? 'success' : 'error')
      return
    }
    if (buying) return
    setBuying(true)
    startCheckout({ variantId: product.lemon_variant_id, userId: user!.id, productId: product.id, email: user!.email, name: [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || undefined, billingCountry: profile?.billing_country, billingState: profile?.billing_state, billingZip: profile?.billing_zip, checkoutMode: product.checkout_mode })
    setTimeout(() => setBuying(false), 1500)
  }

  const toggleWishlist = async () => {
    if (!requireAuth({ type: 'wishlist', productId: product.id })) return
    if (inWishlist) {
      await supabase.from('wishlist').delete().eq('user_id', user!.id).eq('product_id', product.id)
      setInWishlist(false)
      showToast('Removed from wishlist', 'info')
    } else {
      await supabase.from('wishlist').upsert({ user_id: user!.id, product_id: product.id })
      setInWishlist(true)
      showToast('♡ Saved to wishlist', 'success', { label: 'View Wishlist', onClick: () => router.push('/wishlist') })
    }
  }

  const toggleCart = async () => {
    if (!requireAuth({ type: 'cart', productId: product.id })) return
    if (isInCart(product.id)) await removeFromCart(product.id)
    else await addToCart(product.id)
  }

  const renderTabContent = (tab: Tab) => {
    if (tab === 'description') {
      return product.description ? (
        <DescriptionBlocks text={product.description} />
      ) : (
        <p className="text-[13px] text-ink-soft">No description yet.</p>
      )
    }
    if (tab === 'included') {
      return (
        <ul className="text-[13px] text-ink-soft space-y-2">
          {['PDF pattern file (instant download)', 'Step-by-step written instructions', 'Clear, helpful photos throughout', 'Printable, beginner-friendly layout'].map((line) => (
            <li key={line} className="flex items-center gap-2"><CheckIcon /> {line}</li>
          ))}
        </ul>
      )
    }
    if (tab === 'materials') {
      return product.materials ? (
        <ul className="text-[13px] text-ink-soft space-y-1.5 list-disc list-inside">
          {product.materials.split('\n').filter(Boolean).map((line, i) => <li key={i}>{line}</li>)}
        </ul>
      ) : (
        <p className="text-[13px] text-ink-soft">No materials list added for this pattern yet.</p>
      )
    }
    if (tab === 'details') {
      return (
        <div className="rounded-xl px-5 py-4 space-y-2.5 text-[13px]" style={{ background: 'var(--color-surface)' }}>
          <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-1">PATTERN DETAILS</p>
          {product.skill_level && (
            <div className="flex justify-between"><span className="text-ink-soft">Skill Level</span><span className="capitalize">{product.skill_level}</span></div>
          )}
          <div className="flex justify-between"><span className="text-ink-soft">Language</span><span>English (US terms)</span></div>
          <div className="flex justify-between"><span className="text-ink-soft">Format</span><span>PDF (Printable)</span></div>
          {product.pdf_pages && (
            <div className="flex justify-between"><span className="text-ink-soft">Pages</span><span>{product.pdf_pages}</span></div>
          )}
        </div>
      )
    }
    return (
      <div className="text-[13px] text-ink-soft space-y-2">
        <p>Delivered instantly as a downloadable PDF — no waiting, no shipping.</p>
        <p>Find your file anytime under My Account → Orders.</p>
        <p>Refunds honoured within 14 days if the pattern hasn't been downloaded.</p>
        <p>Secure checkout, powered by Lemon Squeezy.</p>
      </div>
    )
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'description', label: 'Description' },
    { key: 'included', label: "What's Included" },
    { key: 'materials', label: 'Materials' },
    { key: 'details', label: 'Details' },
    { key: 'download', label: 'Download Info' },
  ]

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-16 py-8 pb-20 md:pb-14">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[12px] text-ink-soft mb-6 flex-wrap" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link>
        {category && (
          <>
            <span>/</span>
            <Link href={`/shop/${category.slug}`} className="hover:text-ink">{category.name}</Link>
          </>
        )}
        <span>/</span>
        <span className="text-ink truncate max-w-[220px]">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-start">
        <div className="flex flex-col-reverse md:flex-row gap-3">
          {(product.images?.length ?? 0) > 1 && (
            <div className="hidden md:flex md:flex-col gap-2 shrink-0 overflow-visible" style={{ scrollbarWidth: 'none' }}>
              {product.images.map((img, i) => (
                <button key={img} onClick={() => setActiveImage(i)} className={`w-14 h-14 md:w-16 md:h-16 shrink-0 bg-surface overflow-hidden rounded-lg border ${i === activeImage ? 'border-ink' : 'border-transparent'}`}>
                  <img src={deriveVariantUrl(img, 'micro')} alt={`${product.title} — photo ${i + 1}`} loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div
            className="flex-1 relative bg-surface overflow-hidden rounded-xl flex items-center justify-center touch-pan-y"
            style={{ height: 'min(70vh, 640px)' }}
            onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchStartX === null) return
              const delta = e.changedTouches[0].clientX - touchStartX
              if (Math.abs(delta) > 50 && (product.images?.length ?? 0) > 1) {
                setActiveImage((i) => {
                  if (delta < 0) return (i + 1) % product.images.length
                  return (i - 1 + product.images.length) % product.images.length
                })
              }
              setTouchStartX(null)
            }}
          >
            {product.images?.[activeImage] ? (
              <img
                src={product.images[activeImage]}
                srcSet={`${product.images[activeImage]} 640w, ${deriveVariantUrl(product.images[activeImage], 'large')} 1000w, ${deriveVariantUrl(product.images[activeImage], 'full')} 1600w`}
                sizes="(max-width: 768px) 100vw, 50vw"
                alt={product.title}
                loading="eager"
                fetchPriority="high"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-ink-soft text-xs">No image yet</div>
            )}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
              {typeof navigator !== 'undefined' && navigator.share && (
                <button
                  onClick={(e) => { e.stopPropagation(); navigator.share({ title: product.title, url: window.location.href }).catch(() => {}) }}
                  aria-label="Share this product"
                  className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm hover:scale-105 transition-transform"
                  style={{ background: 'var(--color-canvas)' }}
                >
                  <MaterialIcon name="ios_share" size={16} color="var(--color-ink)" />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); toggleWishlist() }}
                aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm hover:scale-105 transition-transform"
                style={{ background: 'var(--color-canvas)' }}
              >
                <MaterialIcon name="favorite" filled={inWishlist} size={18} color={inWishlist ? 'var(--color-madder)' : 'var(--color-ink)'} />
              </button>
            </div>
            {product.images?.[activeImage] && (
              <button
                onClick={(e) => { e.stopPropagation(); setZoomOpen(true) }}
                aria-label="Zoom image"
                className="absolute bottom-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-sm hover:scale-105 transition-transform"
                style={{ background: 'var(--color-canvas)' }}
              >
                <MaterialIcon name="zoom_in" size={18} />
              </button>
            )}
            {(product.images?.length ?? 0) > 1 && (
              <div className="md:hidden absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {product.images.map((_, i) => (
                  <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === activeImage ? 'bg-ink' : 'bg-ink/25'}`} />
                ))}
              </div>
            )}
          </div>
        </div>

        {zoomOpen && product.images?.[activeImage] && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(17,17,17,0.92)' }}
            onClick={() => setZoomOpen(false)}
          >
            <button
              onClick={() => setZoomOpen(false)}
              aria-label="Close zoom"
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
              style={{ background: 'var(--color-canvas)' }}
            >
              <MaterialIcon name="close" size={20} />
            </button>
            <img
              src={deriveVariantUrl(product.images[activeImage], 'full')}
              alt={product.title}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            {(product.images?.length ?? 0) > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImage((i) => (i - 1 + product.images.length) % product.images.length) }}
                  aria-label="Previous image"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
                  style={{ background: 'var(--color-canvas)' }}
                >
                  <MaterialIcon name="chevron_left" size={22} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImage((i) => (i + 1) % product.images.length) }}
                  aria-label="Next image"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
                  style={{ background: 'var(--color-canvas)' }}
                >
                  <MaterialIcon name="chevron_right" size={22} />
                </button>
              </>
            )}
          </div>
        )}

        <div className="md:pt-4">
          {category && (
            <span className="inline-block text-[10px] tracking-[0.15em] uppercase px-3 py-1 rounded-full mb-4" style={{ background: 'var(--color-surface)', color: 'var(--color-ink-soft)' }}>
              {category.name}
            </span>
          )}
          <h1 className="font-display font-semibold text-[28px] sm:text-3xl md:text-4xl leading-tight mb-3 break-words">{product.title}</h1>
          {purchaseCount >= 3 && (
            <p className="text-[12px] text-ink-soft mb-3 flex items-center gap-1.5">
              <MaterialIcon name="download_done" size={14} /> {purchaseCount}+ makers have downloaded this pattern
            </p>
          )}
          <div className="flex items-center gap-3 mb-6">
            {product.price > 0 && product.compare_at_price && product.compare_at_price > product.price ? (
              <>
                <span className="text-xl font-semibold text-ink">${product.price.toFixed(2)}</span>
                <span style={{ color: 'var(--color-madder)' }} className="line-through text-sm">${product.compare_at_price.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-lg">{product.price === 0 ? 'Free' : `$${product.price.toFixed(2)}`}</span>
            )}
          </div>

          {product.description && (
            <p className="text-[14px] text-ink-soft leading-relaxed mb-4">{product.description.split('\n')[0]}</p>
          )}

          <ul className="space-y-2 mb-6 text-[13px]">
            <li className="flex items-center gap-2"><BoltIcon /> Instant PDF Download</li>
            <li className="flex items-center gap-2"><FileIcon /> Step-by-step Instructions</li>
            <li className="flex items-center gap-2"><CheckIcon /> {product.skill_level ? <span className="capitalize">{product.skill_level} Friendly</span> : 'Beginner Friendly'}</li>
            <li className="flex items-center gap-2"><HeartOutlineIcon /> Detailed Photos Included</li>
          </ul>

          <div ref={buyButtonRef} className="space-y-3 mb-3">
            {product.sold_out ? (
              <div className="w-full py-4 border border-line rounded-lg text-center text-[12px] tracking-[0.15em] text-ink-soft">SOLD OUT</div>
            ) : (
              <>
                {product.price > 0 && (
                  isInCart(product.id) ? (
                    <Link href="/cart" className="block text-center w-full py-4 text-canvas text-[12px] tracking-[0.15em] rounded-lg hover:opacity-90 transition-opacity" style={{ background: 'var(--color-accent)' }}>
                      ✓ IN CART — GO TO CART
                    </Link>
                  ) : (
                    <button onClick={toggleCart} className="w-full py-4 text-canvas text-[12px] tracking-[0.15em] rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2" style={{ background: 'var(--color-accent)' }}>
                      <MaterialIcon name="shopping_bag" size={15} /> ADD TO CART
                    </button>
                  )
                )}
                <button
                  onClick={handleBuy}
                  disabled={(product.price === 0 && downloadingFree) || (product.price > 0 && buying)}
                  className={product.price === 0
                    ? 'w-full py-4 text-canvas text-[12px] tracking-[0.15em] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60'
                    : 'w-full py-4 border border-ink text-[12px] tracking-[0.12em] hover:bg-surface transition-colors rounded-lg'}
                  style={product.price === 0 ? { background: 'var(--color-sale-green)' } : undefined}
                >
                  {product.price === 0 ? (downloadingFree ? 'PREPARING…' : 'FREE — DOWNLOAD NOW') : (buying ? 'OPENING CHECKOUT…' : 'BUY NOW')}
                </button>
              </>
            )}
            {owned && (
              <p className="text-[11px] text-ink-soft text-center pt-1">
                You already own this — <Link href="/account/orders" className="underline underline-offset-2 hover:text-ink">go to your downloads</Link>
              </p>
            )}
          </div>

          {!product.sold_out && (
            <p className="text-[11px] text-ink-soft mb-1.5 flex items-center gap-1.5"><LockIcon /> Secure checkout powered by Lemon Squeezy</p>
          )}
          <p className="text-[11px] text-ink-soft mb-6">
            Instant digital download — no shipping. See our <Link href="/refund-policy" className="underline underline-offset-2 hover:text-ink">Refund Policy</Link>.
          </p>

          <div className="flex items-center gap-5 mb-6 text-[12px] text-ink-soft">
            <Link href="/contact" className="flex items-center gap-1.5 hover:text-ink transition-colors">
              <MaterialIcon name="flag" size={15} /> Report an issue
            </Link>
          </div>

          <div className="border border-line rounded-lg px-4 py-2.5 mb-6 flex items-center gap-2 text-[11px] text-ink-soft flex-wrap">
            <span className="font-semibold text-ink shrink-0">HOW IT WORKS</span>
            <span className="text-ink-soft/40">•</span>
            <span>1. Buy or claim</span>
            <span className="text-ink-soft/40">→</span>
            <span>2. Unlocks instantly</span>
            <span className="text-ink-soft/40">→</span>
            <span>3. Download anytime from My Account</span>
          </div>

          {product.wishlist_count > 0 && (
            <p className="text-[11px] text-ink-soft mb-6">♡ {product.wishlist_count} {product.wishlist_count === 1 ? 'person has' : 'people have'} saved this pattern</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_260px] gap-8">
            <div>
              {/* Tabs — desktop only */}
              <div className="hidden md:flex gap-6 border-b border-line overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`pb-3 text-[12px] tracking-[0.08em] whitespace-nowrap border-b-2 -mb-px transition-colors ${activeTab === t.key ? 'border-ink text-ink' : 'border-transparent text-ink-soft hover:text-ink'}`}
                  >
                    {t.label.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="hidden md:block pt-6">
                {renderTabContent(activeTab)}
              </div>

              {/* Accordion — mobile only */}
              <div className="md:hidden border-t border-line">
                {TABS.map((t) => (
                  <div key={t.key} className="border-b border-line">
                    <button
                      onClick={() => setOpenAccordion((s) => (s === t.key ? null : t.key))}
                      className="w-full flex items-center justify-between py-4 text-[12px] tracking-[0.08em] text-ink"
                    >
                      {t.label.toUpperCase()}
                      <ChevronIcon open={openAccordion === t.key} />
                    </button>
                    {openAccordion === t.key && (
                      <div className="pb-4">
                        {renderTabContent(t.key)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar — pattern info + support, desktop only */}
            <div className="hidden md:block space-y-4">
              <div className="rounded-xl px-5 py-4 space-y-2.5 text-[13px]" style={{ background: 'var(--color-surface)' }}>
                <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-1">PATTERN INFO</p>
                <div className="flex justify-between"><span className="text-ink-soft">Format</span><span>PDF (Digital)</span></div>
                {product.pdf_pages && (
                  <div className="flex justify-between"><span className="text-ink-soft">Pages</span><span>{product.pdf_pages}</span></div>
                )}
                <div className="flex justify-between"><span className="text-ink-soft">Language</span><span>English (US)</span></div>
                <div className="flex justify-between"><span className="text-ink-soft">Instant Download</span><span>Yes</span></div>
                {product.skill_level && (
                  <div className="flex justify-between"><span className="text-ink-soft">Skill Level</span><span className="capitalize">{product.skill_level}</span></div>
                )}
                <div className="flex justify-between"><span className="text-ink-soft">Returns</span><span>Non-refundable</span></div>
              </div>

              <div className="rounded-xl px-5 py-4 text-[13px] border border-line">
                <p className="font-medium mb-1">Need help?</p>
                <p className="text-ink-soft">
                  Contact us at{' '}
                  <a href="mailto:engg.muhammadsufyan@gmail.com" className="underline underline-offset-2 hover:text-ink">
                    engg.muhammadsufyan@gmail.com
                  </a>
                </p>
                <p className="text-ink-soft mt-1">We usually respond within 24 hours.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-4 my-8 py-6 px-4 rounded-xl border border-line text-[11px] text-ink-soft">
        <span className="flex flex-col items-center text-center gap-1.5"><BoltIcon /> Instant Access</span>
        <span className="flex flex-col items-center text-center gap-1.5"><LockIcon /> Secure Checkout</span>
        <span className="flex flex-col items-center text-center gap-1.5"><MaterialIcon name="verified" size={13} /> Satisfaction Guarantee</span>
        <span className="flex flex-col items-center text-center gap-1.5"><MaterialIcon name="support_agent" size={13} /> Help When You Need It</span>
      </div>

      {/* Customers also bought — real order co-occurrence, not a guess */}
      {alsoBought.length > 0 && (
        <div className="mt-20 pt-10 border-t border-line">
          <h2 className="font-subheading font-semibold text-2xl mb-6">Customers Also Bought</h2>
          <div className="flex gap-5 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
            {alsoBought.map((p) => (
              <div key={p.id} className="w-[220px] shrink-0">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related products */}
      {related.length > 0 && (
        <div className="mt-20 pt-10 border-t border-line">
          <h2 className="font-subheading font-semibold text-2xl mb-6">You May Also Like</h2>
          <div className="flex gap-5 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
            {related.map((p) => (
              <div key={p.id} className="w-[220px] shrink-0">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="-mx-6 md:-mx-16 mt-10">
        <NewsletterBanner image={product.images?.[0]} />
      </div>

      {/* Sticky mobile buy bar — appears once the primary CTA scrolls out of view */}
      {!product.sold_out && showStickyBar && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-canvas border-t border-line px-5 py-3 flex items-center justify-between gap-4">
          <span className="text-[15px] font-medium shrink-0">{product.price === 0 ? 'Free' : `$${product.price.toFixed(2)}`}</span>
          <button onClick={handleBuy} disabled={(product.price === 0 && downloadingFree) || (product.price > 0 && buying)} className="flex-1 py-3 text-canvas text-[12px] tracking-[0.12em] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60" style={{ background: 'var(--color-sale-green)' }}>
            {product.price === 0 ? (downloadingFree ? 'PREPARING…' : 'FREE — DOWNLOAD NOW') : (buying ? 'OPENING…' : 'BUY NOW')}
          </button>
        </div>
      )}
    </div>
  )
}

function BoltIcon() {
  return <MaterialIcon name="bolt" size={13} />
}
function CheckIcon() {
  return <MaterialIcon name="check" size={13} color="var(--color-sale-green)" />
}
function LockIcon() {
  return <MaterialIcon name="lock" size={13} />
}
function FileIcon() {
  return <MaterialIcon name="description" size={13} />
}
function HeartOutlineIcon() {
  return <MaterialIcon name="favorite" size={13} />
}
function ChevronIcon({ open }: { open: boolean }) {
  return <MaterialIcon name="expand_more" size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
}
