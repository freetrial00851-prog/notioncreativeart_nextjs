'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
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
import { downloadFreePattern } from '../lib/downloads'
import { ProductCard } from '../components/ProductCard'
import { MaterialIcon } from '../components/MaterialIcon'
import { FavoriteIcon, ShareIcon } from '../components/icons'
import { NewsletterBanner } from '../components/NewsletterBanner'
import { ProductDetailSkeleton } from '../components/Skeleton'
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
          return <p key={i} className="text-[12px] text-ink-soft italic mt-5 pt-4 border-t border-line">⚠ {b.content}</p>
        }
        return <p key={i} className="text-[14px] text-ink-soft leading-relaxed mb-3">{b.content}</p>
      })}
    </div>
  )
}

type Tab = 'description' | 'included' | 'materials' | 'skill' | 'details'

export function ProductDetail() {
  const params = useParams()
  const slug = typeof params?.slug === 'string' ? params.slug : undefined
  const { user, profile } = useAuth()
  const { requireAuth, maybeOpenNewsletterPrompt } = useUI()
  const router = useRouter()
  const { addToCart, removeFromCart, isInCart } = useCart()
  const { showToast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [category, setCategory] = useState<{ name: string; slug: string } | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [activeImage, setActiveImage] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [showStickyBar, setShowStickyBar] = useState(false)
  const [lensZoom, setLensZoom] = useState(false)
  const [lensPos, setLensPos] = useState({ x: 0, y: 0, lensW: 0, lensH: 0, boxW: 0, boxH: 0 })
  const galleryRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<Tab>('description')
  const [openAccordion, setOpenAccordion] = useState<Tab | null>('description')
  const buyButtonRef = useRef<HTMLDivElement>(null)
  const [owned, setOwned] = useState(false)
  const [inWishlist, setInWishlist] = useState(false)
  const [loading, setLoading] = useState(true)
  const [downloadingFree, setDownloadingFree] = useState(false)
  const [buying, setBuying] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [shareHint, setShareHint] = useState<string | null>(null)
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

  const updateLens = (clientX: number, clientY: number) => {
    const el = galleryRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const boxW = rect.width
    const boxH = rect.height
    if (boxW < 8 || boxH < 8) return
    const zoom = 2.4
    const lensW = boxW / zoom
    const lensH = boxH / zoom
    const x = Math.min(Math.max(clientX - rect.left - lensW / 2, 0), boxW - lensW)
    const y = Math.min(Math.max(clientY - rect.top - lensH / 2, 0), boxH - lensH)
    setLensPos({ x, y, lensW, lensH, boxW, boxH })
  }

  const canDesktopLensZoom = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    window.matchMedia('(min-width: 1024px)').matches

  if (loading) return <ProductDetailSkeleton />
  if (!product) return (
    <div className="max-w-[1400px] mx-auto px-8 py-32 text-center">
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
  )

  const handleBuy = async () => {
    if (product.price === 0) {
      maybeOpenNewsletterPrompt()
      setDownloadingFree(true)
      const ok = await downloadFreePattern(product.id, product.title, user?.id ?? null)
      setDownloadingFree(false)
      showToast(ok ? 'Downloading your pattern…' : "This pattern's file isn't uploaded yet — please check back soon.", ok ? 'success' : 'error')
      return
    }
    if (!requireAuth({ type: 'buy', productId: product.id })) return
    if (buying) return
    setBuying(true)
    startCheckout({
      variantId: product.lemon_variant_id,
      userId: user!.id,
      productId: product.id,
      email: user!.email,
      name: [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || undefined,
      billingCountry: profile?.billing_country,
      billingState: profile?.billing_state,
      billingZip: profile?.billing_zip,
      checkoutMode: product.checkout_mode,
    })
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
      showToast('♡ Saved to wishlist', 'success', { label: 'View Wishlist', onClick: () => router.push('/account/wishlist') })
    }
  }

  const toggleCart = async () => {
    if (!requireAuth({ type: 'cart', productId: product.id })) return
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
  const shortBlurb = product.description?.split('\n').find((l) => l.trim())?.trim() ?? ''
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

  const formatLabel = 'PDF Download'

  const specs: { icon: string; label: string; value: string }[] = [
    ...(skillLabel ? [{ icon: 'track_changes', label: 'Skill Level', value: skillLabel === 'Beginner' ? 'Easy' : skillLabel }] : []),
    { icon: 'language', label: 'Language', value: 'English (US Terms)' },
    { icon: 'description', label: 'Format', value: formatLabel },
    ...(product.pdf_pages ? [{ icon: 'auto_stories', label: 'Pages', value: `${product.pdf_pages} pages` }] : []),
  ]

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
          <p className="text-[13px] text-ink-soft">No description yet.</p>
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
          <p className="text-[13px] text-ink-soft">No materials list added for this pattern yet.</p>
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
                <p className="text-[13px]">{purchaseCount}+ makers have already downloaded this pattern.</p>
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
    <div className="max-w-[1400px] mx-auto px-6 md:px-16 py-8 pb-24 md:pb-14">
      <nav className="flex items-center gap-2 text-[12px] text-ink-soft mb-8 flex-wrap" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link>
        {category && (
          <>
            <span>›</span>
            <Link href={`/shop/${category.slug}`} className="hover:text-ink">{category.name}</Link>
          </>
        )}
        <span>›</span>
        <span className="text-ink truncate max-w-[260px]">{product.title}</span>
      </nav>

      {/* 3-panel hero: gallery | details | purchase — mobile: gallery → buy → details */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_minmax(260px,320px)] gap-6 lg:gap-8 xl:gap-10 items-start overflow-visible">
        {/* Panel 1 — Gallery */}
        <div className={`min-w-0 relative order-1 ${lensZoom ? 'z-40' : 'z-20'}`}>
          <div
            ref={galleryRef}
            className="relative bg-surface overflow-hidden rounded-2xl flex items-center justify-center touch-pan-y lg:cursor-crosshair select-none"
            style={{ aspectRatio: '1 / 1.05', maxHeight: 'min(68vh, 560px)' }}
            onTouchStart={(e) => {
              setLensZoom(false)
              setTouchStartX(e.touches[0].clientX)
            }}
            onTouchEnd={(e) => {
              if (touchStartX === null) return
              const delta = e.changedTouches[0].clientX - touchStartX
              if (Math.abs(delta) > 50 && images.length > 1) {
                setActiveImage((i) => {
                  if (delta < 0) return (i + 1) % images.length
                  return (i - 1 + images.length) % images.length
                })
              }
              setTouchStartX(null)
            }}
            onMouseEnter={(e) => {
              if (!images[activeImage] || !canDesktopLensZoom()) return
              setLensZoom(true)
              updateLens(e.clientX, e.clientY)
            }}
            onMouseLeave={() => setLensZoom(false)}
            onMouseMove={(e) => {
              if (!canDesktopLensZoom()) return
              if (!lensZoom) setLensZoom(true)
              updateLens(e.clientX, e.clientY)
            }}
          >
            {images[activeImage] ? (
              <img
                src={images[activeImage]}
                srcSet={`${images[activeImage]} 640w, ${deriveVariantUrl(images[activeImage], 'large')} 1000w, ${deriveVariantUrl(images[activeImage], 'full')} 1600w`}
                sizes="(max-width: 1024px) 100vw, 36vw"
                alt={product.title}
                loading="eager"
                fetchPriority="high"
                className="w-full h-full object-cover pointer-events-none select-none"
                draggable={false}
              />
            ) : (
              <div className="text-ink-soft text-xs">No image yet</div>
            )}

            {/* Amazon-style lens — desktop hover only */}
            {lensZoom && images[activeImage] && (
              <div
                className="pointer-events-none absolute hidden lg:block border border-[#7eb6ff]/60"
                style={{
                  left: lensPos.x,
                  top: lensPos.y,
                  width: lensPos.lensW,
                  height: lensPos.lensH,
                  background: 'rgba(145, 200, 255, 0.35)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.35)',
                }}
              />
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

          {/* Desktop zoom pane — appears beside gallery while hovering */}
          {lensZoom && images[activeImage] && lensPos.boxW > 0 && lensPos.lensW > 0 && (
            <div
              className="hidden lg:block absolute left-[calc(100%+12px)] top-0 z-30 rounded-xl border border-line overflow-hidden bg-canvas shadow-[0_8px_32px_rgba(0,0,0,0.14)] pointer-events-none"
              style={{ width: lensPos.boxW, height: lensPos.boxH }}
              aria-hidden
            >
              <img
                src={deriveVariantUrl(images[activeImage], 'full')}
                alt=""
                draggable={false}
                className="max-w-none object-cover"
                style={{
                  width: lensPos.boxW * (lensPos.boxW / lensPos.lensW),
                  height: lensPos.boxH * (lensPos.boxH / lensPos.lensH),
                  transform: `translate(${-lensPos.x * (lensPos.boxW / lensPos.lensW)}px, ${-lensPos.y * (lensPos.boxH / lensPos.lensH)}px)`,
                }}
              />
            </div>
          )}

          {/* Mobile: graduated dots + wishlist / share (Amazon-style) */}
          {images.length > 0 && (
            <div className="lg:hidden mt-3 flex items-center justify-between px-0.5">
              <div className="flex-1" />
              <GalleryDots count={images.length} active={activeImage} />
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

          {/* Desktop thumbnails */}
          {images.length > 1 && (
            <div className="hidden lg:flex mt-3 items-center gap-2">
              <button
                onClick={() => setActiveImage((i) => (i - 1 + images.length) % images.length)}
                aria-label="Previous image"
                className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center hover:bg-[#d4d4d4] transition-colors"
                style={{ background: '#e5e5e5', color: '#555' }}
              >
                <MaterialIcon name="chevron_left" size={18} />
              </button>
              <div className="flex gap-2 overflow-x-auto flex-1 py-0.5 justify-center" style={{ scrollbarWidth: 'none' }}>
                {images.map((img, i) => (
                  <button
                    key={img}
                    onClick={() => { setActiveImage(i); setLensZoom(false) }}
                    onMouseEnter={() => setActiveImage(i)}
                    className={`w-16 h-16 sm:w-[68px] sm:h-[68px] shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${i === activeImage ? 'border-[var(--color-accent)]' : 'border-transparent'}`}
                    style={{ background: 'var(--color-surface)' }}
                  >
                    <img src={deriveVariantUrl(img, 'micro')} alt={`${product.title} — photo ${i + 1}`} loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <button
                onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                aria-label="Next image"
                className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center hover:bg-[#d4d4d4] transition-colors"
                style={{ background: '#e5e5e5', color: '#555' }}
              >
                <MaterialIcon name="chevron_right" size={18} />
              </button>
            </div>
          )}

          {/* Mobile title strip — sits with product before buy box */}
          <div className="lg:hidden mt-4">
            {category && (
              <span className="inline-block text-[10px] tracking-[0.14em] uppercase px-3 py-1 rounded-full mb-2" style={{ background: 'var(--color-surface)', color: 'var(--color-ink-soft)' }}>
                {category.name}
              </span>
            )}
            <h1 className="font-display font-semibold text-[24px] leading-tight break-words">
              {product.title}
            </h1>
          </div>
        </div>

        {/* Panel 2 — Product details (desktop middle; mobile after buy) */}
        <div className="min-w-0 lg:pt-1 order-3 lg:order-2">
          <div className="hidden lg:block">
            {category && (
              <span className="inline-block text-[10px] tracking-[0.14em] uppercase px-3 py-1 rounded-full mb-3" style={{ background: 'var(--color-surface)', color: 'var(--color-ink-soft)' }}>
                {category.name}
              </span>
            )}
            <h1 className="font-display font-semibold text-[26px] sm:text-[1.85rem] xl:text-[2rem] leading-tight mb-3 break-words">
              {product.title}
            </h1>
          </div>

          {purchaseCount >= 3 && (
            <p className="text-[12px] text-ink-soft mb-3 flex items-center gap-1.5 mt-1 lg:mt-0">
              <MaterialIcon name="download_done" size={14} /> {purchaseCount}+ makers have downloaded this pattern
            </p>
          )}

          {shortBlurb && (
            <p className="text-[14px] text-ink-soft leading-relaxed mb-5">{shortBlurb}</p>
          )}

          <ul className="space-y-2.5 mb-5">
            {specs.map((s) => (
              <li key={s.label} className="flex items-center gap-3 text-[13px]">
                <MaterialIcon name={s.icon} size={18} color="var(--color-ink-soft)" />
                <span className="text-ink-soft">{s.label}:</span>
                <span className="font-medium text-ink truncate">{s.value}</span>
              </li>
            ))}
          </ul>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-3 py-1 rounded-full border border-line text-ink-soft"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {product.wishlist_count > 0 && (
            <p className="text-[11px] text-ink-soft mt-5">♡ {product.wishlist_count} {product.wishlist_count === 1 ? 'person has' : 'people have'} saved this pattern</p>
          )}
        </div>

        {/* Panel 3 — Purchase card (mobile: right after gallery/title) */}
        <div ref={buyButtonRef} className="rounded-2xl border border-line p-5 sm:p-6 space-y-4 lg:sticky lg:top-24 order-2 lg:order-3">
          <div>
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
              <p className="text-[12px] text-ink-soft mt-1">One-time purchase · Instant PDF download</p>
            )}
          </div>

          {product.sold_out ? (
            <div className="w-full py-3.5 border border-line rounded-lg text-center text-[12px] tracking-[0.15em] text-ink-soft">SOLD OUT</div>
          ) : (
            <div className="space-y-2.5">
              {product.price > 0 && (
                isInCart(product.id) ? (
                  <Link
                    href="/cart"
                    className="block text-center w-full py-3.5 text-canvas text-[12px] tracking-[0.15em] rounded-lg hover:opacity-90 transition-opacity"
                    style={{ background: 'var(--color-accent)' }}
                  >
                    ✓ IN CART — GO TO CART
                  </Link>
                ) : (
                  <button
                    onClick={toggleCart}
                    className="w-full py-3.5 text-canvas text-[12px] tracking-[0.15em] rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    style={{ background: 'var(--color-accent)' }}
                  >
                    <MaterialIcon name="shopping_bag" size={15} /> ADD TO CART
                  </button>
                )
              )}
              <button
                onClick={handleBuy}
                disabled={(product.price === 0 && downloadingFree) || (product.price > 0 && buying)}
                className={product.price === 0
                  ? 'w-full py-3.5 text-canvas text-[12px] tracking-[0.15em] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60'
                  : 'w-full py-3.5 border border-ink text-[12px] tracking-[0.12em] hover:bg-surface transition-colors rounded-lg disabled:opacity-60'}
                style={product.price === 0 ? { background: 'var(--color-sale-green)' } : undefined}
              >
                {product.price === 0
                  ? (downloadingFree ? 'PREPARING…' : 'FREE — DOWNLOAD NOW')
                  : (buying ? 'OPENING CHECKOUT…' : 'BUY NOW')}
              </button>
              <button
                onClick={toggleWishlist}
                className="w-full py-3 border border-line text-[12px] tracking-[0.1em] rounded-lg hover:bg-surface transition-colors flex items-center justify-center gap-2"
              >
                <FavoriteIcon size={15} filled={inWishlist} color={inWishlist ? 'var(--color-madder)' : 'var(--color-ink)'} />
                {inWishlist ? 'SAVED TO WISHLIST' : 'ADD TO WISHLIST'}
              </button>
              <button
                onClick={shareListing}
                className="hidden lg:flex w-full py-3 border border-line text-[12px] tracking-[0.1em] rounded-lg hover:bg-surface transition-colors items-center justify-center gap-2"
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
            <div className="rounded-xl px-3.5 py-3 space-y-3" style={{ background: 'var(--color-surface)' }}>
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

      {/* Full-width tabs */}
      <div className="mt-14 md:mt-16 pt-2 order-4">
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
        <div className="mt-16 md:mt-20 pt-10 border-t border-line">
          <div className="flex items-end justify-between gap-4 mb-6">
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
        <div className="mt-16 md:mt-20 pt-10 border-t border-line">
          <div className="flex items-end justify-between gap-4 mb-6">
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

      <div className="-mx-6 md:-mx-16 mt-12">
        <NewsletterBanner image={images[0]} />
      </div>

      {!product.sold_out && showStickyBar && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-canvas border-t border-line px-5 py-3 flex items-center justify-between gap-4">
          <span className="text-[15px] font-medium shrink-0">{product.price === 0 ? 'Free' : `$${product.price.toFixed(2)}`}</span>
          <button
            onClick={handleBuy}
            disabled={(product.price === 0 && downloadingFree) || (product.price > 0 && buying)}
            className="flex-1 py-3 text-canvas text-[12px] tracking-[0.12em] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ background: 'var(--color-sale-green)' }}
          >
            {product.price === 0 ? (downloadingFree ? 'PREPARING…' : 'FREE — DOWNLOAD NOW') : (buying ? 'OPENING…' : 'BUY NOW')}
          </button>
        </div>
      )}
    </div>
  )
}

function CheckIcon() {
  return <MaterialIcon name="check" size={15} color="var(--color-sale-green)" />
}

/** Graduated carousel dots — active largest, neighbors smaller (Instagram/Amazon style). */
function GalleryDots({ count, active }: { count: number; active: number }) {
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
          <span
            key={i}
            role="presentation"
            className="rounded-full bg-ink transition-[width,height,opacity] duration-150"
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
