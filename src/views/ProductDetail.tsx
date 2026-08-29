'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { startApiCheckout } from '../lib/lemonsqueezy'
import { getPrefetchedProduct } from '../lib/prefetchCache'
import { deriveVariantUrl } from '../lib/imageVariants'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useToast } from '../context/ToastContext'
import { downloadFreePattern } from '../lib/downloads'
import { useIsMobile } from '../lib/useIsMobile'
import { ProductCard } from '../components/ProductCard'
import { MaterialIcon } from '../components/MaterialIcon'
import { FavoriteIcon, ShareIcon } from '../components/icons'
import { NewsletterBanner } from '../components/NewsletterBanner'
import { ProductDetailSkeleton } from '../components/Skeleton'
import { profileDisplayName } from '../lib/profileName'
import type { Product } from '../lib/types'

/** Stage candidates: mobile stops at large (1000w); desktop may use full (1600w). */
function gallerySrcSet(cardUrl: string, includeFull: boolean) {
  const large = deriveVariantUrl(cardUrl, 'large')
  if (!includeFull) return `${cardUrl} 640w, ${large} 1000w`
  return `${cardUrl} 640w, ${large} 1000w, ${deriveVariantUrl(cardUrl, 'full')} 1600w`
}

function gallerySizes(includeFull: boolean) {
  return includeFull
    ? '(max-width: 1024px) 62vw, 52vw'
    : '100vw'
}

/** Warm the browser cache for a gallery stage URL (and its srcset). */
function preloadGalleryStage(cardUrl: string, includeFull: boolean) {
  const img = new Image()
  img.decoding = 'async'
  img.sizes = gallerySizes(includeFull)
  img.srcset = gallerySrcSet(cardUrl, includeFull)
  img.src = deriveVariantUrl(cardUrl, includeFull ? 'full' : 'large')
}

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
    if (/^[_\-─—]{3,}$/.test(line)) continue
    if (/^[✓✔]\s*/.test(line)) { flush(); blocks.push({ type: 'check', content: line.replace(/^[✓✔]\s*/, '') }); continue }
    if (/^[⚠️!]\s*(note|warning)/i.test(line) || /^⚠/.test(line)) { flush(); blocks.push({ type: 'warning', content: line.replace(/^[⚠️!]\s*/, '') }); continue }
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
          return <p key={i} className="flex items-start gap-2 text-[14px] text-ink-soft leading-relaxed"><span className="mt-0.5"><CheckIcon /></span><span>{b.content}</span></p>
        }
        if (b.type === 'warning') {
          return <p key={i} className="text-[14px] text-ink-soft italic leading-relaxed mt-5 pt-4 border-t border-line">⚠ {b.content}</p>
        }
        return <p key={i} className="text-[14px] text-ink-soft leading-relaxed mb-3">{b.content}</p>
      })}
    </div>
  )
}

type Tab = 'description' | 'included' | 'materials' | 'skill' | 'details'

export function ProductDetail({ initialProduct = null }: { initialProduct?: Product | null }) {
  const params = useParams()
  const slug = typeof params?.slug === 'string' ? params.slug : undefined
  const { user, profile } = useAuth()
  const { requireAuth, maybeOpenNewsletterPrompt, showBusyOverlay, hideBusyOverlay } = useUI()
  const router = useRouter()
  const { addToCart, removeFromCart, isInCart } = useCart()
  const { isWishlisted, toggleWishlist: toggleWishlistItem } = useWishlist()
  const { showToast } = useToast()
  const seeded =
    initialProduct && slug && initialProduct.slug === slug ? initialProduct : null
  const [product, setProduct] = useState<Product | null>(() => seeded)
  const [category, setCategory] = useState<{ name: string; slug: string } | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [activeImage, setActiveImage] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [touchStartY, setTouchStartY] = useState<number | null>(null)
  const [showStickyBar, setShowStickyBar] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('description')
  const [openAccordion, setOpenAccordion] = useState<Tab | null>('description')
  const buyButtonRef = useRef<HTMLDivElement>(null)
  const [owned, setOwned] = useState(false)
  const [loading, setLoading] = useState(() => !seeded)
  const [downloadingFree, setDownloadingFree] = useState(false)
  const [buying, setBuying] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [shareHint, setShareHint] = useState<string | null>(null)
  const [purchaseCount, setPurchaseCount] = useState(0)
  const [alsoBought, setAlsoBought] = useState<Product[]>([])
  const isMobileGallery = useIsMobile(769)

  useEffect(() => {
    if (!slug) return

    // Server ISR payload already has this product — skip the duplicate base fetch.
    // Soft-nav to another slug still fetches (or uses hover prefetch when available).
    if (initialProduct && initialProduct.slug === slug) {
      setProduct(initialProduct)
      setUnavailable(false)
      setLoading(false)
      setActiveTab('description')
      setActiveImage(0)
      return
    }

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
        const { data: everExisted } = await supabase.rpc('product_slug_ever_existed', { check_slug: slug })
        setUnavailable(!!everExisted)
      }
      setLoading(false)
      setActiveTab('description')
      setActiveImage(0)
    })
  }, [slug, initialProduct])

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

  useEffect(() => {
    if (!product) { setPurchaseCount(0); return }
    supabase.rpc('get_purchase_count', { target_product_id: product.id }).then(({ data }) => setPurchaseCount(data ?? 0))
  }, [product])

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
  }, [user, product])

  const inWishlist = product ? isWishlisted(product.id) : false

  useEffect(() => {
    if (!buyButtonRef.current) return
    const observer = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting), { threshold: 0 })
    observer.observe(buyButtonRef.current)
    return () => observer.disconnect()
  }, [product])

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

  // Preload adjacent gallery stages so swipe/arrow doesn't wait on network.
  useEffect(() => {
    const imgs = product?.images ?? []
    if (imgs.length < 2) return
    const includeFull = !isMobileGallery
    const neighbors = [
      (activeImage + 1) % imgs.length,
      (activeImage - 1 + imgs.length) % imgs.length,
    ]
    for (const i of new Set(neighbors)) {
      const url = imgs[i]
      if (url) preloadGalleryStage(url, includeFull)
    }
  }, [product?.images, activeImage, isMobileGallery])

  // Warm the category shop route so breadcrumb clicks feel instant.
  // Must stay above any conditional returns (Rules of Hooks).
  useEffect(() => {
    if (!category?.slug) return
    router.prefetch(`/shop/${category.slug}`)
  }, [router, category?.slug])

  if (loading) return <ProductDetailSkeleton />
  if (!product) return (
    <div className="max-w-site w-full mx-auto px-8 py-32 text-center">
      {unavailable ? (
        <>
          <p className="font-subheading text-2xl mb-3">This pattern is no longer available.</p>
          <p className="text-ink-soft text-[14px] leading-relaxed mb-6 max-w-sm mx-auto">The maker has taken this listing down. If you already own it, it's still in your account under Downloads.</p>
        </>
      ) : (
        <p className="font-subheading text-2xl mb-4">Pattern not found.</p>
      )}
      <Link href="/shop" className="text-[12px] tracking-[0.12em] border-b border-ink pb-1">BACK TO SHOP →</Link>
    </div>
  )

  const handleBuy = async () => {
    if (product.price === 0) {
      if (downloadingFree) return
      setDownloadingFree(true)
      showBusyOverlay('download')
      const result = await downloadFreePattern(product.id, product.title, user?.id ?? null)
      hideBusyOverlay()
      setDownloadingFree(false)
      showToast(result.ok ? 'Downloading your pattern…' : (result.error ?? "This pattern's file isn't uploaded yet — please check back soon."), result.ok ? 'success' : 'error')
      // Newsletter after overlay clears so they don't stack on screen.
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
    if (!product) return
    const { added } = await toggleWishlistItem(product.id)
    if (added) {
      showToast('♡ Saved to wishlist', 'success', { label: 'View Wishlist', onClick: () => router.push('/account/wishlist') })
    } else {
      showToast('Removed from wishlist', 'info')
    }
  }

  const toggleCart = async () => {
    if (!product || product.price === 0) return
    if (isInCart(product.id)) await removeFromCart(product.id)
    else await addToCart(product.id)
  }

  const shareListing = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const title = product.title
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, text: `Check out this crochet pattern: ${title}`, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setShareHint('Link copied')
      showToast('Link copied to clipboard', 'success')
      setTimeout(() => setShareHint(null), 2000)
    } catch {
      /* user cancelled share — ignore */
    }
  }

  const images = product.images ?? []
  const onSale = !!(product.compare_at_price && product.compare_at_price > product.price && product.price > 0)
  const badge = product.card_badge
  const skillLabel = product.skill_level
    ? product.skill_level.charAt(0).toUpperCase() + product.skill_level.slice(1)
    : null

  const tags: string[] = []
  if (category) tags.push(category.name)
  if (skillLabel) tags.push(skillLabel === 'Beginner' ? 'Beginner Friendly' : skillLabel)
  if (product.price === 0) tags.push('Free')
  if (product.is_bundle) tags.push('Bundle')
  if (badge === 'new') tags.push('New')
  if (badge === 'sale') tags.push('Sale')
  if (badge === 'featured') tags.push('Featured')

  const TABS: { key: Tab; label: string }[] = [
    { key: 'description', label: 'Description' },
    { key: 'included', label: "What's Included" },
    { key: 'materials', label: 'Materials' },
    { key: 'skill', label: 'Skill Level' },
    { key: 'details', label: 'Details' },
  ]

  const tabSideImage = images[1] || images[0] || null

  const wrapTabWithImage = (body: ReactNode) => (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(240px,380px)] gap-8 lg:gap-12 items-start">
      <div className="min-w-0">{body}</div>
      {tabSideImage && (
        <div className="rounded-2xl overflow-hidden bg-surface flex items-center justify-center p-3 sm:p-4 min-h-[240px] lg:min-h-[320px]">
          <img
            src={tabSideImage}
            srcSet={`${tabSideImage} 640w, ${deriveVariantUrl(tabSideImage, 'large')} 1000w`}
            sizes="(max-width: 1024px) 100vw, 380px"
            alt=""
            loading="lazy"
            className="w-full h-auto max-h-[420px] object-contain"
          />
        </div>
      )}
    </div>
  )

  const renderTabContent = (tab: Tab) => {
    if (tab === 'description') {
      return wrapTabWithImage(
        product.description ? (
          <div>
            <h3 className="font-subheading font-semibold text-xl mb-4">Pattern Description</h3>
            <DescriptionBlocks text={product.description} />
          </div>
        ) : (
          <p className="text-[14px] text-ink-soft leading-relaxed">No description yet.</p>
        )
      )
    }
    if (tab === 'included') {
      return wrapTabWithImage(
        <ul className="text-[14px] text-ink-soft space-y-3 max-w-xl">
          {[
            product.pdf_filename ? `PDF pattern file — ${product.pdf_filename}` : 'PDF pattern file (instant download)',
            'Step-by-step written instructions',
            'Clear, helpful photos throughout',
            'Printable, beginner-friendly layout',
            ...(product.is_bundle && product.bundle_includes?.length
              ? product.bundle_includes.map((item) => `Includes: ${item}`)
              : []),
          ].map((line) => (
            <li key={line} className="flex items-start gap-2.5"><CheckIcon /> <span>{line}</span></li>
          ))}
        </ul>
      )
    }
    if (tab === 'materials') {
      return wrapTabWithImage(
        product.materials ? (
          <ul className="text-[14px] text-ink-soft space-y-2 list-disc list-inside max-w-xl">
            {product.materials.split('\n').filter(Boolean).map((line, i) => <li key={i}>{line}</li>)}
          </ul>
        ) : (
          <p className="text-[14px] text-ink-soft leading-relaxed">No materials list added for this pattern yet.</p>
        )
      )
    }
    if (tab === 'skill') {
      return wrapTabWithImage(
        <div className="max-w-xl space-y-3 text-[14px] text-ink-soft">
          {skillLabel ? (
            <>
              <p>
                This pattern is designed for a <span className="text-ink font-medium capitalize">{product.skill_level}</span> skill level
                {product.skill_level === 'beginner' ? ' — clear steps and photos so you can follow along with confidence.' : '.'}
              </p>
              {purchaseCount >= 3 && (
                <p className="text-[14px] leading-relaxed">{purchaseCount}+ makers have already downloaded this pattern.</p>
              )}
            </>
          ) : (
            <p>Skill level has not been set for this pattern yet.</p>
          )}
        </div>
      )
    }
    return wrapTabWithImage(
      <div className="rounded-xl px-5 py-4 space-y-2.5 text-[14px] max-w-md" style={{ background: 'var(--color-surface)' }}>
        <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-1">PATTERN DETAILS</p>
        {skillLabel && (
          <div className="flex justify-between gap-4"><span className="text-ink-soft">Skill Level</span><span className="capitalize">{product.skill_level}</span></div>
        )}
        <div className="flex justify-between gap-4"><span className="text-ink-soft">Language</span><span>English (US terms)</span></div>
        <div className="flex justify-between gap-4"><span className="text-ink-soft">Format</span><span>PDF (Printable)</span></div>
        {product.pdf_filename && (
          <div className="flex justify-between gap-4"><span className="text-ink-soft">File</span><span className="text-right truncate max-w-[200px]">{product.pdf_filename}</span></div>
        )}
        {product.pdf_pages && (
          <div className="flex justify-between gap-4"><span className="text-ink-soft">Pages</span><span>{product.pdf_pages}</span></div>
        )}
        <div className="flex justify-between gap-4"><span className="text-ink-soft">Delivery</span><span>Instant download</span></div>
      </div>
    )
  }

  const shopLink = category ? `/shop/${category.slug}` : '/shop'

  return (
    <div className="max-w-site w-full mx-auto px-6 md:px-16 py-8 pb-24 md:pb-14">
      <nav className="flex items-center gap-2 text-[12px] text-ink-soft mb-8 flex-wrap" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link>
        {category && (
          <>
            <span>›</span>
            <Link href={shopLink} prefetch className="hover:text-ink">{category.name}</Link>
          </>
        )}
        <span>›</span>
        <span className="text-ink truncate max-w-[260px]">{product.title}</span>
      </nav>

      {/* Hero layout
          < lg: single column — gallery → title/badges/buy
          ≥ lg: 2-col gallery | info + buy (Etsy-style) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)] gap-6 lg:gap-8 items-start overflow-visible">
        {/* Left — Gallery */}
        <div className="min-w-0 relative z-20">
          <div className={`flex flex-col ${images.length > 1 ? 'md:flex-row md:gap-3' : ''} md:items-start`}>
            {/* Vertical thumbnails — tablet + desktop (≥768) */}
            {images.length > 1 && (
              <div
                className="hidden md:flex flex-col gap-2.5 shrink-0 overflow-y-auto max-h-[min(78vh,720px)] py-0.5"
                style={{ scrollbarWidth: 'thin' }}
              >
                {images.map((img, i) => (
                  <button
                    key={`v-${img}-${i}`}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={`w-[72px] h-[72px] shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${i === activeImage ? 'border-[var(--color-accent)]' : 'border-transparent'}`}
                    style={{ background: 'var(--color-surface)' }}
                  >
                    <img src={deriveVariantUrl(img, 'micro')} alt={`${product.title} — photo ${i + 1}`} loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="min-w-0 flex-1 w-full">
              <div
                className="relative bg-surface border border-line overflow-hidden rounded-2xl flex items-center justify-center select-none w-full"
                style={{ aspectRatio: '1 / 1.05', maxHeight: 'min(78vh, 720px)', touchAction: 'pan-y' }}
                onTouchStart={(e) => {
                  setTouchStartX(e.touches[0].clientX)
                  setTouchStartY(e.touches[0].clientY)
                }}
                onTouchEnd={(e) => {
                  if (touchStartX === null) return
                  const endX = e.changedTouches[0].clientX
                  const endY = e.changedTouches[0].clientY
                  const deltaX = endX - touchStartX
                  const deltaY = endY - (touchStartY ?? endY)
                  if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) && images.length > 1) {
                    setActiveImage((i) => {
                      if (deltaX < 0) return (i + 1) % images.length
                      return (i - 1 + images.length) % images.length
                    })
                  }
                  setTouchStartX(null)
                  setTouchStartY(null)
                }}
              >
                {images[activeImage] ? (
                  <img
                    src={deriveVariantUrl(images[activeImage], isMobileGallery ? 'large' : 'full')}
                    srcSet={gallerySrcSet(images[activeImage], !isMobileGallery)}
                    sizes={isMobileGallery ? '100vw' : '(max-width: 1024px) 62vw, 52vw'}
                    alt={product.title}
                    loading="eager"
                    fetchPriority="high"
                    className="w-full h-full object-contain pointer-events-none select-none"
                    draggable={false}
                  />
                ) : (
                  <div className="text-ink-soft text-xs">No image yet</div>
                )}

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setActiveImage((i) => (i - 1 + images.length) % images.length) }}
                      aria-label="Previous image"
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center bg-white/90 shadow-md hover:bg-white transition-colors"
                    >
                      <MaterialIcon name="chevron_left" size={22} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setActiveImage((i) => (i + 1) % images.length) }}
                      aria-label="Next image"
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center bg-white/90 shadow-md hover:bg-white transition-colors"
                    >
                      <MaterialIcon name="chevron_right" size={22} />
                    </button>
                  </>
                )}

                <div className="absolute top-3 left-3 z-10 flex gap-2 pointer-events-none">
                  {badge === 'new' && (
                    <span className="text-[10px] tracking-[0.12em] font-semibold uppercase px-2.5 py-1 rounded-md text-canvas" style={{ background: 'var(--color-sale-green)' }}>
                      New
                    </span>
                  )}
                  {badge === 'sale' && (
                    <span className="text-[10px] tracking-[0.12em] font-semibold uppercase px-2.5 py-1 rounded-md text-canvas" style={{ background: 'var(--color-madder)' }}>
                      Sale
                    </span>
                  )}
                  {badge === 'featured' && (
                    <span className="text-[10px] tracking-[0.12em] font-semibold uppercase px-2.5 py-1 rounded-md text-canvas" style={{ background: 'var(--color-ink)' }}>
                      Featured
                    </span>
                  )}
                </div>
              </div>

              {/* Dots (mobile only) + wishlist / share (mobile + tablet) */}
              {images.length > 0 && (
                <div className="lg:hidden mt-3 flex items-center justify-between px-0.5">
                  <div className="flex-1" />
                  <div className="md:hidden">
                    <GalleryDots count={images.length} active={activeImage} onSelect={setActiveImage} />
                  </div>
                  <div className="flex-1 flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={toggleWishlist}
                      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                      className="w-9 h-9 flex items-center justify-center text-ink"
                    >
                      <FavoriteIcon size={20} filled={inWishlist} color={inWishlist ? 'var(--color-madder)' : 'currentColor'} />
                    </button>
                    <button
                      type="button"
                      onClick={shareListing}
                      aria-label="Share listing"
                      className="w-9 h-9 flex items-center justify-center text-ink"
                      title={shareHint ?? 'Share'}
                    >
                      <ShareIcon size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* Horizontal thumbnails — mobile only (<768), no side arrows */}
              {images.length > 1 && (
                <div className="md:hidden mt-3 flex gap-2 overflow-x-auto py-0.5" style={{ scrollbarWidth: 'none' }}>
                  {images.map((img, i) => (
                    <button
                      key={`h-${img}-${i}`}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      className={`w-14 h-14 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${i === activeImage ? 'border-[var(--color-accent)]' : 'border-transparent'}`}
                      style={{ background: 'var(--color-surface)' }}
                    >
                      <img src={deriveVariantUrl(img, 'micro')} alt={`${product.title} — photo ${i + 1}`} loading="lazy" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right — badges, title, buy box */}
        <div className="min-w-0 lg:pt-1 lg:sticky lg:top-24 lg:self-start">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 lg:mb-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] tracking-[0.14em] uppercase px-3 py-1 rounded-full"
                  style={{ background: 'var(--color-surface)', color: 'var(--color-ink-soft)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h1 className="font-display font-semibold text-[24px] sm:text-[1.85rem] xl:text-[2rem] leading-tight mb-3 break-words">
            {product.title}
          </h1>

          {product.subtitle?.trim() ? (
            <p className="text-[14px] text-ink-soft leading-relaxed line-clamp-2 mb-3">{product.subtitle.trim()}</p>
          ) : null}

          {purchaseCount >= 3 && (
            <p className="text-[12px] text-ink-soft mb-3 flex items-center gap-1.5">
              <MaterialIcon name="download_done" size={14} /> {purchaseCount}+ makers have downloaded this pattern
            </p>
          )}

          <div ref={buyButtonRef} className="rounded-2xl border border-line p-4 sm:p-5 space-y-2">
          <div className="space-y-0.5">
            {product.price > 0 && onSale ? (
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-2xl sm:text-[1.75rem] font-semibold text-ink">${product.price.toFixed(2)} <span className="text-sm font-normal text-ink-soft">USD</span></span>
                <span style={{ color: 'var(--color-madder)' }} className="line-through text-sm">${product.compare_at_price!.toFixed(2)}</span>
              </div>
            ) : (
              <p className="text-2xl sm:text-[1.75rem] font-semibold text-ink">
                {product.price === 0 ? 'Free' : `$${product.price.toFixed(2)}`}
                {product.price > 0 && <span className="text-sm font-normal text-ink-soft ml-1">USD</span>}
              </p>
            )}
            {product.price > 0 && (
              <p className="text-[12px] text-ink-soft leading-tight">One-time purchase</p>
            )}
          </div>

          {product.sold_out ? (
            <div className="w-full py-3.5 border border-line rounded-full text-center text-[12px] tracking-[0.15em] text-ink-soft">SOLD OUT</div>
          ) : (
            <div className="space-y-1.5">
              {product.price > 0 && (
                isInCart(product.id) ? (
                  <Link
                    href="/cart"
                    className="block text-center w-full py-3 text-canvas text-[13px] font-semibold rounded-full hover:opacity-90 transition-opacity"
                    style={{ background: 'var(--color-accent)' }}
                  >
                    ✓ In cart — go to cart
                  </Link>
                ) : (
                  <button
                    onClick={toggleCart}
                    className="w-full py-3 text-canvas text-[13px] font-semibold rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    style={{ background: 'var(--color-accent)' }}
                  >
                    <MaterialIcon name="shopping_bag" size={15} /> Add to Cart
                  </button>
                )
              )}
              <button
                onClick={handleBuy}
                disabled={(product.price === 0 && downloadingFree) || (product.price > 0 && buying)}
                className={product.price === 0
                  ? 'w-full py-3 text-canvas text-[13px] font-semibold rounded-full hover:opacity-90 transition-opacity disabled:opacity-60'
                  : 'w-full py-3 border border-ink text-[13px] font-semibold hover:bg-surface transition-colors rounded-full disabled:opacity-60'}
                style={product.price === 0 ? { background: 'var(--color-sale-green)' } : undefined}
              >
                {product.price === 0
                  ? 'Download free'
                  : 'Buy now'}
              </button>
              <button
                onClick={toggleWishlist}
                className="w-full py-2.5 border border-line text-[12px] tracking-[0.1em] rounded-full hover:bg-surface transition-colors flex items-center justify-center gap-2"
              >
                <FavoriteIcon size={15} filled={inWishlist} color={inWishlist ? 'var(--color-madder)' : 'var(--color-ink)'} />
                {inWishlist ? 'SAVED TO WISHLIST' : 'ADD TO WISHLIST'}
              </button>
              <button
                onClick={shareListing}
                className="w-full py-2.5 border border-line text-[12px] tracking-[0.1em] rounded-full hover:bg-surface transition-colors flex items-center justify-center gap-2"
              >
                <ShareIcon size={15} />
                {shareHint ? 'LINK COPIED' : 'SHARE LISTING'}
              </button>
            </div>
          )}

          {owned && (
            <p className="text-[11px] text-ink-soft text-center">
              You already own this — <Link href="/account/orders" className="underline underline-offset-2 hover:text-ink">go to your downloads</Link>
            </p>
          )}

          {!product.sold_out && (
            <div className="rounded-xl px-3.5 py-2.5 space-y-2" style={{ background: 'var(--color-surface)' }}>
              <div className="flex gap-2.5 items-start">
                <MaterialIcon name="download" size={16} color="var(--color-sale-green)" />
                <div>
                  <p className="text-[12px] font-medium text-ink">Instant Download</p>
                  <p className="text-[11px] text-ink-soft leading-snug">Your PDF is ready right after purchase.</p>
                </div>
              </div>
              <div className="flex gap-2.5 items-start">
                <MaterialIcon name="lock" size={16} color="var(--color-sale-green)" />
                <div>
                  <p className="text-[12px] font-medium text-ink">Secure Checkout</p>
                  <p className="text-[11px] text-ink-soft leading-snug">Payments protected by Lemon Squeezy.</p>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Full-width tabs */}
      <div className="mt-14 md:mt-16 pt-2">
        <div className="hidden md:flex gap-7 border-b border-line overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`pb-3.5 text-[12px] tracking-[0.1em] whitespace-nowrap border-b-2 -mb-px transition-colors ${activeTab === t.key ? 'border-ink text-ink' : 'border-transparent text-ink-soft hover:text-ink'}`}
            >
              {t.label.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="hidden md:block pt-8">
          {renderTabContent(activeTab)}
        </div>

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
                <div className="pb-5">
                  {renderTabContent(t.key)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {alsoBought.length > 0 && (
        <div
          className="-mx-6 md:-mx-16 mt-10 px-6 md:px-16 py-3.5 md:py-5"
          style={{ background: 'var(--color-surface)' }}
        >
          <div className="flex items-end justify-between gap-4 mb-8">
            <h2 className="font-subheading font-semibold text-2xl">Customers Also Bought</h2>
            <Link href={shopLink} className="text-[12px] tracking-[0.08em] text-ink-soft hover:text-ink shrink-0">
              View all →
            </Link>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
            {alsoBought.map((p) => (
              <div key={p.id} className="w-[220px] shrink-0">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      )}

      {related.length > 0 && (
        <div
          className="-mx-6 md:-mx-16 px-6 md:px-16 py-3.5 md:py-5"
          style={{ background: alsoBought.length > 0 ? 'var(--color-background)' : 'var(--color-surface)' }}
        >
          <div className="flex items-end justify-between gap-4 mb-8">
            <h2 className="font-subheading font-semibold text-2xl">You May Also Like</h2>
            <Link href={shopLink} className="text-[12px] tracking-[0.08em] text-ink-soft hover:text-ink shrink-0">
              View all →
            </Link>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
            {related.map((p) => (
              <div key={p.id} className="w-[220px] shrink-0">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="-mx-6 md:-mx-16 px-6 md:px-16 py-3.5 md:py-5" style={{ background: 'var(--color-surface)' }}>
        <NewsletterBanner image={images[0]} />
      </div>

      {!product.sold_out && showStickyBar && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-canvas border-t border-line px-5 py-3">
          {product.price === 0 ? (
            <button
              onClick={handleBuy}
              disabled={downloadingFree}
              className="w-full py-3 text-canvas text-[13px] font-semibold rounded-full hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ background: 'var(--color-sale-green)' }}
            >
              Download free
            </button>
          ) : isInCart(product.id) ? (
            <Link
              href="/cart"
              className="block w-full py-3 text-canvas text-[13px] font-semibold rounded-full hover:opacity-90 transition-opacity text-center"
              style={{ background: 'var(--color-sale-green)' }}
            >
              In cart
            </Link>
          ) : (
            <button
              onClick={toggleCart}
              className="w-full py-3 text-canvas text-[13px] font-semibold rounded-full hover:opacity-90 transition-opacity"
              style={{ background: 'var(--color-sale-green)' }}
            >
              Add to Cart
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function CheckIcon() {
  return <MaterialIcon name="check" size={15} color="var(--color-sale-green)" />
}

/** Graduated carousel dots — active largest, neighbors smaller (Instagram/Amazon style). */
function GalleryDots({ count, active, onSelect }: { count: number; active: number; onSelect?: (i: number) => void }) {
  if (count <= 1) return null
  const windowSize = Math.min(5, count)
  const start = Math.max(0, Math.min(active - Math.floor(windowSize / 2), count - windowSize))
  const indices = Array.from({ length: windowSize }, (_, k) => start + k)

  return (
    <div className="flex items-center justify-center gap-[5px]" role="tablist" aria-label="Image gallery">
      {indices.map((i) => {
        const dist = Math.abs(i - active)
        const size = i === active ? 7 : dist === 1 ? 5.5 : 4
        const opacity = i === active ? 1 : dist === 1 ? 0.4 : 0.25
        return (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`Show image ${i + 1}`}
            onClick={() => onSelect?.(i)}
            className="rounded-full bg-ink transition-[width,height,opacity] duration-150 p-0 border-0"
            style={{ width: size, height: size, opacity }}
          />
        )
      })}
    </div>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return <MaterialIcon name="expand_more" size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
}
