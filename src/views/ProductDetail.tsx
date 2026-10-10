'use client'

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import Image, { getImageProps } from 'next/image'
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
import { downloadFreePattern, triggerPdfDownload } from '../lib/downloads'
import { isFreeProduct } from '../lib/product'
import { fetchProductReviewStats } from '../lib/reviews'
import { useReviewStatsMapForLists } from '../lib/useReviewStatsMap'
import { PatternCard } from '../components/PatternCard'
import { PatternGrid } from '../components/PatternGrid'
import { ProductReviews } from '../components/ProductReviews'
import { StarRating } from '../components/StarRating'
import { MaterialIcon } from '../components/MaterialIcon'
import { DownloadIcon, FavoriteIcon, ShareIcon } from '../components/icons'
import { StatusBadge } from '../components/ui/Badge'
import { ProductDetailSkeleton } from '../components/Skeleton'
import { SKILL_PILL_STYLES, skillLevelTagLabel } from '../lib/productCardMeta'
import { profileDisplayName } from '../lib/profileName'
import type { Product, ReviewStats } from '../lib/types'

/**
 * Main gallery sizes — stable across SSR and hydration.
 * Must match `GALLERY_LCP_SIZES` in `app/(customer)/pattern/[slug]/page.tsx`
 * (server preload) or the browser fetches the LCP image twice.
 */
const GALLERY_LCP_SIZES = '(max-width: 1023px) 100vw, 600px'

/**
 * Warm Vercel `/_next/image` for a gallery neighbor — must match the stage
 * `<Image>` URL (optimizer src/srcSet), not raw Supabase, or swipe stays cold.
 */
function preloadGalleryStage(cardUrl: string) {
  const src = deriveVariantUrl(cardUrl, 'large')
  const { props } = getImageProps({
    src,
    alt: '',
    width: 1000,
    height: 1000,
    sizes: GALLERY_LCP_SIZES,
  })
  const id = `nca-gallery-preload-${src}`
  if (document.getElementById(id)) return

  const link = document.createElement('link')
  link.id = id
  link.rel = 'preload'
  link.as = 'image'
  if (props.srcSet) link.setAttribute('imageSrcSet', props.srcSet)
  if (props.sizes) link.setAttribute('imageSizes', props.sizes)
  if (props.src) link.href = props.src
  document.head.appendChild(link)
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
    <div className="space-y-3">
      {formatDescription(text).map((b, i) => {
        if (b.type === 'heading') {
          return <p key={i} className="text-[12px] tracking-[0.12em] text-muted font-bold mt-6 first:mt-0">{b.content}</p>
        }
        if (b.type === 'check') {
          return <TickLine key={i}>{b.content}</TickLine>
        }
        if (b.type === 'warning') {
          return (
            <p key={i} className="flex items-start gap-2 text-[14px] text-muted leading-relaxed rounded-[14px] border border-border bg-surface-warm px-4 py-3">
              <MaterialIcon name="info" size={18} className="mt-0.5 shrink-0" />
              <span>{b.content}</span>
            </p>
          )
        }
        return <p key={i} className="text-[15px] text-muted leading-relaxed">{b.content}</p>
      })}
    </div>
  )
}

function TickLine({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-3 text-[15px] text-ink leading-snug">
      <MaterialIcon name="check" size={18} color="var(--color-secondary)" className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  )
}

function TickList({ items }: { items: string[] }) {
  if (items.length === 0) return null
  return (
    <ul className="space-y-2.5">
      {items.map((line) => (
        <li key={line}><TickLine>{line}</TickLine></li>
      ))}
    </ul>
  )
}

function Chip({ children, style, className = '' }: { children: ReactNode; style?: CSSProperties; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-[12px] font-semibold leading-none ${className}`}
      style={style}
    >
      {children}
    </span>
  )
}

type Tab = 'description' | 'included' | 'materials' | 'skill' | 'details'

const TABS: { key: Tab; label: string }[] = [
  { key: 'description', label: 'Description' },
  { key: 'included', label: "What's included" },
  { key: 'materials', label: 'Materials' },
  { key: 'skill', label: 'Skill level' },
  { key: 'details', label: 'Details' },
]

type OwnedInfo = { purchaseDate: string | null; orderId: string | null; orderNumber: string | null }

const ICON_BUTTON =
  'inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-sm transition-opacity hover:opacity-90'

function formatPurchaseDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function ProductDetail({
  initialProduct = null,
  hideOwnerCopyPlaceholders = false,
}: {
  initialProduct?: Product | null
  /** Production: hide copy that still needs the owner's real text (support email, license note). */
  hideOwnerCopyPlaceholders?: boolean
}) {
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
  const [categoryState, setCategoryState] = useState<{ id: string; data: { name: string; slug: string } | null } | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [activeImage, setActiveImage] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [touchStartY, setTouchStartY] = useState<number | null>(null)
  const [showStickyBar, setShowStickyBar] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('description')
  const [openAccordion, setOpenAccordion] = useState<Tab | null>('description')
  const buyButtonRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({})
  const [ownedState, setOwnedState] = useState<{ userId: string; info: OwnedInfo | null } | null>(null)
  const [loading, setLoading] = useState(() => !seeded)
  const [downloadingFree, setDownloadingFree] = useState(false)
  const [downloadingOwned, setDownloadingOwned] = useState(false)
  const [buying, setBuying] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [reviewStats, setReviewStats] = useState<ReviewStats>({ averageRating: 0, reviewCount: 0 })
  const [reviewFormOpen, setReviewFormOpen] = useState(false)
  const [alsoBought, setAlsoBought] = useState<Product[]>([])
  const carouselReviewStats = useReviewStatsMapForLists([alsoBought, related])

  useEffect(() => {
    // Seeded from the server ISR payload — `page.tsx` keys this component by
    // slug, so soft-nav to another pattern remounts with fresh state.
    if (!slug || seeded) return

    let cancelled = false
    const prefetched = getPrefetchedProduct(slug)
    const fetchProduct = prefetched ?? supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .eq('active', true)
      .single()
      .then(({ data }) => data as Product | null)

    fetchProduct.then(async (data) => {
      if (cancelled) return
      setProduct(data)
      if (!data) {
        const { data: everExisted } = await supabase.rpc('product_slug_ever_existed', { check_slug: slug })
        if (cancelled) return
        setUnavailable(!!everExisted)
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [slug, seeded])

  useEffect(() => {
    const categoryId = product?.category_id
    if (!categoryId) return
    supabase.from('categories').select('name, slug').eq('id', categoryId).maybeSingle()
      .then(({ data }) => setCategoryState({ id: categoryId, data: data as { name: string; slug: string } | null }))
  }, [product?.category_id])

  useEffect(() => {
    if (!product) return
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
    if (!product) return
    fetchProductReviewStats(product.id).then(setReviewStats)
  }, [product])

  useEffect(() => {
    if (!product) return
    supabase.rpc('get_also_bought', { target_product_id: product.id, result_limit: 8 }).then(async ({ data: ids }) => {
      if (!ids || ids.length === 0) { setAlsoBought([]); return }
      const { data: items } = await supabase.from('products').select('*').eq('active', true).in('id', ids)
      const byId = new Map((items as Product[] ?? []).map((p) => [p.id, p]))
      setAlsoBought((ids as string[]).map((id) => byId.get(id)).filter((p): p is Product => !!p))
    })
  }, [product])

  useEffect(() => {
    if (!user || !product) return
    const userId = user.id
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select('id, order_id, purchase_date, order:orders(lemon_order_id)')
        .eq('user_id', userId)
        .eq('product_id', product.id)
        .order('purchase_date', { ascending: false })
        .limit(1)
      if (cancelled) return
      if (!error) {
        const row = data?.[0] as
          | { order_id: string | null; purchase_date: string | null; order: { lemon_order_id: string | null } | { lemon_order_id: string | null }[] | null }
          | undefined
        const order = Array.isArray(row?.order) ? row?.order[0] : row?.order
        setOwnedState({
          userId,
          info: row
            ? { purchaseDate: row.purchase_date, orderId: row.order_id, orderNumber: order?.lemon_order_id ?? null }
            : null,
        })
        return
      }
      // Ownership must never depend on the order join — fall back to the plain check.
      const { data: plain } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', product.id)
        .limit(1)
      if (cancelled) return
      setOwnedState({
        userId,
        info: plain && plain.length > 0 ? { purchaseDate: null, orderId: null, orderNumber: null } : null,
      })
    })()
    return () => { cancelled = true }
  }, [user, product])

  const ownedInfo = user && ownedState?.userId === user.id ? ownedState.info : null
  const owned = !!ownedInfo
  const category =
    product?.category_id && categoryState?.id === product.category_id ? categoryState.data : null
  const inWishlist = product ? isWishlisted(product.id) : false

  useEffect(() => {
    if (!buyButtonRef.current) return
    const observer = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting), { threshold: 0 })
    observer.observe(buyButtonRef.current)
    return () => observer.disconnect()
  }, [product])

  // Preload adjacent gallery stages so swipe/arrow doesn't wait on network.
  useEffect(() => {
    const imgs = product?.images ?? []
    if (imgs.length < 2) return
    const neighbors = [
      (activeImage + 1) % imgs.length,
      (activeImage - 1 + imgs.length) % imgs.length,
    ]
    for (const i of new Set(neighbors)) {
      const url = imgs[i]
      if (url) preloadGalleryStage(url)
    }
  }, [product?.images, activeImage])

  // Warm the category shop route so breadcrumb clicks feel instant.
  // Must stay above any conditional returns (Rules of Hooks).
  useEffect(() => {
    if (!category?.slug) return
    router.prefetch(`/shop/${category.slug}`)
  }, [router, category?.slug])

  if (loading) return <ProductDetailSkeleton />
  if (!product) return (
    <div className="max-w-site w-full mx-auto px-5 md:px-10 lg:px-8 py-24 md:py-32 text-center">
      {unavailable ? (
        <>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-ink mb-3">This pattern is no longer available</h1>
          <p className="text-muted text-[15px] leading-relaxed mb-8 max-w-md mx-auto">The maker has taken this listing down. If you already own it, it&apos;s still in your account under Downloads.</p>
        </>
      ) : (
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-ink mb-8">Pattern not found</h1>
      )}
      <Link
        href="/shop"
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-[14px] font-semibold text-primary-contrast hover:bg-primary-hover transition-colors"
      >
        Back to shop
      </Link>
    </div>
  )

  const handleBuy = async () => {
    if (isFreeProduct(product)) {
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

  /** Owned paid pattern — same signed-URL download as Account › Downloads. */
  const handleOwnedDownload = async () => {
    if (downloadingOwned) return
    setDownloadingOwned(true)
    showBusyOverlay('download')
    const ok = await triggerPdfDownload(product.id, product.title)
    hideBusyOverlay()
    setDownloadingOwned(false)
    showToast(
      ok ? 'Downloading your pattern…' : "This pattern's file isn't uploaded yet — please check back soon.",
      ok ? 'success' : 'error',
    )
  }

  const toggleWishlist = async () => {
    if (!product) return
    const { added } = await toggleWishlistItem(product.id)
    if (added) {
      showToast('Saved to wishlist', 'success', { label: 'View Wishlist', onClick: () => router.push('/account/wishlist') })
    } else {
      showToast('Removed from wishlist', 'info')
    }
  }

  const toggleCart = async () => {
    if (!product || isFreeProduct(product) || Number(product.price) === 0) return
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
      showToast('Link copied to clipboard', 'success')
    } catch {
      /* user cancelled share — ignore */
    }
  }

  const openReviewForm = () => {
    setReviewFormOpen(true)
    requestAnimationFrame(() => {
      document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const images = product.images ?? []
  const free = isFreeProduct(product)
  const mode: 'free' | 'owned' | 'paid' = free ? 'free' : owned ? 'owned' : 'paid'
  const inCart = isInCart(product.id)
  const onSale = !!(product.compare_at_price && product.compare_at_price > product.price && product.price > 0)
  const savePercent = onSale ? Math.round((1 - product.price / product.compare_at_price!) * 100) : 0
  const badge = product.card_badge
  const skillLabel = skillLevelTagLabel(product.skill_level)
  const shopLink = category ? `/shop/${category.slug}` : '/shop'
  const shortDescription = product.subtitle?.trim() || ''
  const hasReviews = reviewStats.reviewCount > 0

  const pdfLine = product.pdf_pages ? `${product.pdf_pages}-page printable PDF pattern` : 'Printable PDF pattern'
  const paidTicks = [
    'Instant PDF download after payment',
    ...(product.pdf_pages ? [`${product.pdf_pages}-page printable PDF pattern`] : []),
    'Lifetime access in your account',
  ]
  const downloadTicks = [
    pdfLine,
    ...(product.materials?.trim() ? ['Materials list'] : []),
  ]

  const tabSideImage = images[1] || images[0] || null

  const wrapTabWithImage = (body: ReactNode) => (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] gap-8 lg:gap-12 items-start">
      <div className="min-w-0">{body}</div>
      {tabSideImage && (
        <div className="relative w-full aspect-[16/9] lg:aspect-square overflow-hidden rounded-[18px] border border-border bg-tint-sage">
          <Image
            src={deriveVariantUrl(tabSideImage, 'large')}
            alt={`${product.title}, lifestyle photo`}
            fill
            sizes="(max-width: 1023px) 100vw, 360px"
            className="object-cover"
          />
        </div>
      )}
    </div>
  )

  const renderTabContent = (tab: Tab, opts?: { includeSectionHeading?: boolean }) => {
    const includeHeading = opts?.includeSectionHeading !== false
    if (tab === 'description') {
      return wrapTabWithImage(
        product.description ? (
          <div>
            {includeHeading ? (
              <h2 className="text-[22px] font-bold text-ink mb-4">About this pattern</h2>
            ) : null}
            <DescriptionBlocks text={product.description} />
          </div>
        ) : (
          <p className="text-[15px] text-muted leading-relaxed">No description yet.</p>
        )
      )
    }
    if (tab === 'included') {
      return wrapTabWithImage(
        <TickList
          items={[
            product.pdf_filename ? `PDF pattern file: ${product.pdf_filename}` : 'PDF pattern file (instant download)',
            ...(product.pdf_pages ? [`${product.pdf_pages} printable pages`] : []),
            ...(skillLabel ? [`Written for ${skillLabel.toLowerCase()} makers`] : []),
            ...(product.materials?.trim() ? ['Materials list'] : []),
            ...(product.is_bundle && product.bundle_includes?.length
              ? product.bundle_includes.map((item) => `Includes: ${item}`)
              : []),
          ]}
        />
      )
    }
    if (tab === 'materials') {
      return wrapTabWithImage(
        product.materials ? (
          <ul className="text-[15px] text-ink space-y-2 list-disc pl-5 max-w-xl">
            {product.materials.split('\n').filter(Boolean).map((line, i) => <li key={i}>{line}</li>)}
          </ul>
        ) : (
          <p className="text-[15px] text-muted leading-relaxed">No materials list added for this pattern yet.</p>
        )
      )
    }
    if (tab === 'skill') {
      return wrapTabWithImage(
        <div className="max-w-xl text-[15px] text-muted leading-relaxed">
          {skillLabel ? (
            <p>
              This pattern is designed for a <span className="text-ink font-semibold capitalize">{product.skill_level}</span> skill level
              {product.skill_level === 'beginner' ? ', with clear steps and photos so you can follow along with confidence.' : '.'}
            </p>
          ) : (
            <p>Skill level has not been set for this pattern yet.</p>
          )}
        </div>
      )
    }
    const detailRows: [string, ReactNode][] = [
      ['Craft type', 'Crochet'],
      ...(skillLabel ? [['Skill level', <span key="s" className="capitalize">{product.skill_level}</span>] as [string, ReactNode]] : []),
      ...(product.materials?.trim()
        ? [['Yarn and hook size', <span key="m" className="whitespace-pre-line">{product.materials.trim()}</span>] as [string, ReactNode]]
        : []),
      ['Language and terms', 'English (US crochet terms)'],
      ['Format', 'PDF (printable)'],
      ...(product.pdf_filename ? [['File', <span key="f" className="break-all">{product.pdf_filename}</span>] as [string, ReactNode]] : []),
      ...(product.pdf_pages ? [['Pages', String(product.pdf_pages)] as [string, ReactNode]] : []),
      ['Delivery', 'Instant download'],
    ]
    return wrapTabWithImage(
      <dl className="max-w-md rounded-[18px] border border-border bg-surface-warm divide-y divide-border text-[14px]">
        {detailRows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-6 px-5 py-3">
            <dt className="text-muted shrink-0">{label}</dt>
            <dd className="text-ink text-right min-w-0">{value}</dd>
          </div>
        ))}
      </dl>
    )
  }

  const onTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const idx = TABS.findIndex((t) => t.key === activeTab)
    let next = -1
    if (e.key === 'ArrowRight') next = (idx + 1) % TABS.length
    else if (e.key === 'ArrowLeft') next = (idx - 1 + TABS.length) % TABS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = TABS.length - 1
    if (next < 0) return
    e.preventDefault()
    const key = TABS[next].key
    setActiveTab(key)
    tabRefs.current[key]?.focus()
  }

  const goPrev = () => setActiveImage((i) => (i - 1 + images.length) % images.length)
  const goNext = () => setActiveImage((i) => (i + 1) % images.length)

  const relatedShown = related.slice(0, 4)
  const relatedIds = new Set(relatedShown.map((p) => p.id))
  const alsoBoughtShown = alsoBought.filter((p) => !relatedIds.has(p.id)).slice(0, 4)

  const priceBlock = mode === 'free' ? (
    <p className="text-[34px] md:text-[38px] font-extrabold leading-none text-free">Free</p>
  ) : mode === 'paid' && product.price > 0 ? (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <p className="text-[34px] md:text-[38px] font-extrabold leading-none text-primary">${product.price.toFixed(2)}</p>
      {onSale && (
        <>
          <p className="text-[18px] text-muted line-through">
            <span className="sr-only">Was </span>${product.compare_at_price!.toFixed(2)}
          </p>
          <span className="inline-flex items-center rounded-full bg-sale/10 px-2.5 py-1 text-[12px] font-bold text-sale">
            Save {savePercent}%
          </span>
        </>
      )}
    </div>
  ) : null

  const primaryButtonClass =
    'inline-flex w-full min-h-[52px] items-center justify-center gap-2 rounded-full bg-primary px-6 text-[15px] font-semibold text-primary-contrast transition-colors hover:bg-primary-hover disabled:opacity-60'
  const secondaryButtonClass =
    'inline-flex w-full min-h-[52px] items-center justify-center gap-2 rounded-full border-[1.5px] border-primary bg-white px-6 text-[15px] font-semibold text-primary transition-colors hover:bg-primary-soft disabled:opacity-60'

  const soldOutPill = (
    <div className="flex min-h-[52px] w-full items-center justify-center rounded-full border border-border text-[13px] font-semibold tracking-[0.12em] text-muted">
      SOLD OUT
    </div>
  )

  return (
    <div className="pb-24 md:pb-0">
      {/* Hero: gallery + buy box */}
      <section className="max-w-site w-full mx-auto px-5 md:px-10 lg:px-8 pt-5 md:pt-6 pb-10 md:pb-14">
        <Link
          href="/shop"
          className="md:hidden -ml-2 mb-3 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-[15px] font-medium text-muted hover:text-ink"
        >
          <MaterialIcon name="chevron_left" size={20} />
          Shop
        </Link>
        <nav aria-label="Breadcrumb" className="hidden md:block mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
            <li><Link href="/" className="hover:text-ink">Home</Link></li>
            <li aria-hidden>›</li>
            <li><Link href="/shop" className="hover:text-ink">Shop</Link></li>
            {category && (
              <>
                <li aria-hidden>›</li>
                <li><Link href={shopLink} prefetch className="hover:text-ink">{category.name}</Link></li>
              </>
            )}
            <li aria-hidden>›</li>
            <li aria-current="page" className="font-semibold text-ink truncate max-w-[320px]">{product.title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-start">
          {/* Gallery */}
          <div className="min-w-0">
            <div
              className="relative aspect-square w-full overflow-hidden rounded-[18px] border border-border bg-surface-soft shadow-image select-none"
              style={{ touchAction: 'pan-y' }}
              role="region"
              aria-roledescription="carousel"
              aria-label={`${product.title} photos`}
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
                  if (deltaX < 0) goNext()
                  else goPrev()
                }
                setTouchStartX(null)
                setTouchStartY(null)
              }}
            >
              {images[activeImage] ? (
                <Image
                  src={deriveVariantUrl(images[activeImage], 'large')}
                  alt={images.length > 1 ? `${product.title}, photo ${activeImage + 1} of ${images.length}` : product.title}
                  fill
                  priority={activeImage === 0}
                  fetchPriority={activeImage === 0 ? 'high' : 'auto'}
                  sizes={GALLERY_LCP_SIZES}
                  className="object-contain pointer-events-none select-none"
                  draggable={false}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted text-sm">No image yet</div>
              )}

              <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col items-start gap-1 md:left-4 md:top-4">
                {product.sold_out && <StatusBadge status="sold_out" />}
                {!product.sold_out && badge === 'new' && <StatusBadge status="new" />}
                {!product.sold_out && badge === 'sale' && <StatusBadge status="sale" />}
                {!product.sold_out && badge === 'featured' && <StatusBadge status="featured" />}
              </div>

              <button
                type="button"
                onClick={toggleWishlist}
                aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                aria-pressed={inWishlist}
                className={`absolute right-3 top-3 z-10 md:right-4 md:top-4 ${ICON_BUTTON}`}
              >
                <FavoriteIcon size={20} filled={inWishlist} color={inWishlist ? 'var(--color-sale)' : 'currentColor'} />
              </button>

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); goPrev() }}
                    aria-label="Previous image"
                    className={`absolute left-3 top-1/2 z-10 -translate-y-1/2 md:left-4 ${ICON_BUTTON}`}
                  >
                    <MaterialIcon name="chevron_left" size={24} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); goNext() }}
                    aria-label="Next image"
                    className={`absolute right-3 top-1/2 z-10 -translate-y-1/2 md:right-4 ${ICON_BUTTON}`}
                  >
                    <MaterialIcon name="chevron_right" size={24} />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <>
                {/* Mobile: position dots (decorative — arrows + swipe navigate) */}
                <div className="md:hidden mt-3 flex items-center justify-center gap-1.5" aria-hidden>
                  {images.map((img, i) => (
                    <span
                      key={`${img}-${i}`}
                      className={`h-[7px] rounded-full transition-[width,background-color] duration-150 ${i === activeImage ? 'w-6 bg-primary' : 'w-[7px] bg-border'}`}
                    />
                  ))}
                </div>
                <p className="sr-only" aria-live="polite">Image {activeImage + 1} of {images.length}</p>

                {/* Tablet + laptop: thumbnails */}
                <div className="hidden md:flex mt-3 gap-3 overflow-x-auto py-0.5" style={{ scrollbarWidth: 'none' }}>
                  {images.map((img, i) => (
                    <button
                      key={`${img}-${i}`}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      aria-label={`Show image ${i + 1}`}
                      aria-current={i === activeImage ? 'true' : undefined}
                      className={`relative h-[86px] lg:h-[98px] shrink-0 basis-[calc((100%-36px)/4)] overflow-hidden rounded-[14px] bg-surface transition-colors ${i === activeImage ? 'border-2 border-primary' : 'border border-border hover:border-muted-light'}`}
                    >
                      <Image
                        src={deriveVariantUrl(img, 'thumb')}
                        alt=""
                        fill
                        sizes="(max-width: 1023px) 25vw, 140px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Buy box */}
          <div className="min-w-0 lg:pt-1">
            <div className="flex flex-wrap gap-2 mb-3">
              {skillLabel && product.skill_level && (
                <Chip style={SKILL_PILL_STYLES[product.skill_level]}>{skillLabel}</Chip>
              )}
              {category && <Chip className="border border-border bg-surface-warm text-muted">{category.name}</Chip>}
              {product.is_bundle && <Chip className="border border-border bg-surface-warm text-muted">Bundle</Chip>}
              {mode === 'free' && <Chip className="border border-border bg-success-bg text-free">Free</Chip>}
            </div>

            <div className="flex items-start justify-between gap-4 mb-3">
              <h1
                className={`font-heading font-bold leading-[1.15] text-ink break-words min-w-0 ${
                  product.title.length > 60
                    ? 'text-[24px] md:text-[28px] lg:text-[30px]'
                    : 'text-[30px] md:text-[38px] lg:text-[40px]'
                }`}
              >
                {product.title}
              </h1>
              <button
                type="button"
                onClick={shareListing}
                aria-label="Share this pattern"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-white text-ink transition-colors hover:bg-surface-warm md:mt-1"
              >
                <ShareIcon size={18} />
              </button>
            </div>

            {hasReviews && (
              <div className="mb-4 flex flex-wrap items-center gap-2 text-[14px]">
                <StarRating value={reviewStats.averageRating} size={18} />
                <span className="font-bold text-ink tabular-nums">{reviewStats.averageRating.toFixed(1)}</span>
                <a href="#reviews" className="text-primary underline underline-offset-2 hover:text-primary-hover">
                  ({reviewStats.reviewCount} review{reviewStats.reviewCount === 1 ? '' : 's'})
                </a>
              </div>
            )}

            {mode === 'owned' && (
              <div className="mb-4 flex items-start gap-3 rounded-[18px] border border-border bg-success-bg px-4 py-4 md:px-5">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-free text-white" aria-hidden>
                  <MaterialIcon name="check" size={20} />
                </span>
                <div className="min-w-0">
                  <p className="text-[16px] font-bold text-free">You own this pattern</p>
                  {(ownedInfo?.purchaseDate || ownedInfo?.orderNumber) && (
                    <p className="text-[14px] text-muted">
                      {ownedInfo?.purchaseDate && <>Bought {formatPurchaseDate(ownedInfo.purchaseDate)}</>}
                      {ownedInfo?.purchaseDate && ownedInfo?.orderNumber && ' · '}
                      {ownedInfo?.orderNumber && <>Order #{ownedInfo.orderNumber}</>}
                    </p>
                  )}
                </div>
              </div>
            )}

            {priceBlock && <div className="mb-4">{priceBlock}</div>}

            {shortDescription && (
              <p className="mb-5 text-[16px] leading-relaxed text-muted">{shortDescription}</p>
            )}

            {mode === 'paid' && <div className="mb-6"><TickList items={paidTicks} /></div>}

            <div ref={buyButtonRef}>
              {mode === 'paid' && (
                product.sold_out ? soldOutPill : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-1">
                    {inCart ? (
                      <Link href="/cart" className={primaryButtonClass}>
                        <MaterialIcon name="check" size={20} />
                        In cart, view cart
                      </Link>
                    ) : (
                      <button type="button" onClick={toggleCart} className={primaryButtonClass}>
                        Add to cart
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleBuy}
                      disabled={buying}
                      aria-busy={buying || undefined}
                      className={secondaryButtonClass}
                    >
                      Buy now
                    </button>
                  </div>
                )
              )}

              {mode === 'owned' && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleOwnedDownload}
                    disabled={downloadingOwned}
                    aria-busy={downloadingOwned || undefined}
                    className={primaryButtonClass}
                  >
                    <DownloadIcon size={20} />
                    Download PDF
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    {ownedInfo?.orderId ? (
                      <Link href={`/account/orders/${ownedInfo.orderId}`} className={`${secondaryButtonClass} min-h-12`}>
                        View order
                      </Link>
                    ) : (
                      <Link href="/account/downloads" className={`${secondaryButtonClass} min-h-12`}>
                        My downloads
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={openReviewForm}
                      className="inline-flex min-h-12 items-center justify-center rounded-full px-4 text-[15px] font-semibold text-primary hover:underline"
                    >
                      Leave a review
                    </button>
                  </div>
                </div>
              )}

              {mode === 'free' && (
                <div>
                  <button
                    type="button"
                    onClick={handleBuy}
                    disabled={downloadingFree}
                    aria-busy={downloadingFree || undefined}
                    className={primaryButtonClass}
                  >
                    <DownloadIcon size={20} />
                    Download free PDF
                  </button>
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-[13px] text-muted">
                    <MaterialIcon name="verified_user" size={16} color="var(--color-secondary)" />
                    No account needed. Instant PDF download.
                  </p>
                </div>
              )}
            </div>

            {mode === 'paid' && !product.sold_out && (
              <div className="mt-5 flex items-start gap-3 rounded-[18px] border border-border bg-surface-warm px-4 py-4 md:px-5">
                <MaterialIcon name="verified_user" size={20} color="var(--color-primary)" className="mt-0.5 shrink-0" />
                <div className="min-w-0 text-[14px]">
                  <p className="font-bold text-ink">Secure checkout by Lemon Squeezy</p>
                  <p className="mt-1 leading-relaxed text-muted">
                    You will sign in or create a free account at checkout, so your PDF is saved to your downloads.
                  </p>
                  <Link
                    href="/refund-policy"
                    className="mt-2 inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-2 hover:text-primary-hover md:min-h-0 md:mt-3"
                  >
                    Refund policy
                  </Link>
                </div>
              </div>
            )}

            {(mode === 'owned' || mode === 'free') && (
              <div className="mt-6">
                <h2 className="mb-3 text-[16px] font-bold text-ink">
                  {mode === 'owned' ? 'In your download' : 'What you get'}
                </h2>
                <TickList items={downloadTicks} />
              </div>
            )}

            {mode === 'owned' && !hideOwnerCopyPlaceholders && (
              <p className="mt-5 rounded-[18px] border border-border bg-surface-warm px-5 py-4 text-[14px] leading-relaxed text-muted">
                {/* TODO(owner): real support email */}
                Can not open the file? Write to <span className="text-primary underline">[SUPPORT EMAIL]</span> and we will fix it.
              </p>
            )}

            {mode === 'free' && (
              <div className="mt-5 rounded-[18px] border border-border bg-surface-warm px-5 py-4">
                <p className="text-[16px] font-bold text-ink">Like this pattern?</p>
                <p className="mt-1 text-[14px] leading-relaxed text-muted">
                  Explore more patterns at the same level, with photos and full instructions.
                </p>
                <Link
                  href={product.skill_level ? `/shop?level=${product.skill_level}` : '/shop'}
                  className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-[15px] font-bold text-primary hover:underline"
                >
                  {skillLabel ? `Shop ${skillLabel} patterns` : 'Shop all patterns'}
                  <span aria-hidden>→</span>
                </Link>
              </div>
            )}

            {mode === 'free' && !hideOwnerCopyPlaceholders && (
              <p className="mt-4 text-[13px] leading-relaxed text-muted">
                {/* TODO(owner): license note */}
                [LICENSE NOTE: for example, personal use only, no resale.]
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Tabs (tablet + laptop) / accordion (mobile) */}
      <section className="border-t border-border bg-surface">
        <div className="max-w-site w-full mx-auto px-5 md:px-10 lg:px-8 py-4 md:py-12">
          <div role="tablist" aria-label="Pattern information" className="hidden md:flex gap-8 border-b border-border overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {TABS.map((t) => {
              const selected = activeTab === t.key
              return (
                <button
                  key={t.key}
                  ref={(el) => { tabRefs.current[t.key] = el }}
                  id={`tab-${t.key}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`panel-${t.key}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveTab(t.key)}
                  onKeyDown={onTabKeyDown}
                  className={`-mb-px min-h-11 whitespace-nowrap border-b-2 pb-3 text-[15px] font-semibold transition-colors ${selected ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink'}`}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
          <div
            id={`panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            tabIndex={0}
            className="hidden md:block pt-8"
          >
            {renderTabContent(activeTab, { includeSectionHeading: true })}
          </div>

          <div className="md:hidden">
            {TABS.map((t) => {
              const open = openAccordion === t.key
              return (
                <div key={t.key} className="border-b border-border">
                  <h2>
                    <button
                      type="button"
                      id={`acc-${t.key}`}
                      aria-expanded={open}
                      aria-controls={`acc-panel-${t.key}`}
                      onClick={() => setOpenAccordion((s) => (s === t.key ? null : t.key))}
                      className="flex min-h-14 w-full items-center justify-between gap-4 text-left text-[16px] font-bold text-ink"
                    >
                      {t.label}
                      <MaterialIcon
                        name="expand_more"
                        size={22}
                        style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
                      />
                    </button>
                  </h2>
                  {open && (
                    <div id={`acc-panel-${t.key}`} role="region" aria-labelledby={`acc-${t.key}`} className="pb-6">
                      {t.key === 'description' && product.description && (
                        <h3 className="mb-3 text-[20px] font-bold text-ink">About this pattern</h3>
                      )}
                      {renderTabContent(t.key, { includeSectionHeading: false })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Customer reviews */}
      <section id="reviews" className="scroll-mt-24 border-t border-border bg-surface-warm">
        <div className="max-w-site w-full mx-auto px-5 md:px-10 lg:px-8 py-12 md:py-16">
          <ProductReviews
            productId={product.id}
            userId={user?.id ?? null}
            profile={profile}
            owned={owned}
            formOpen={reviewFormOpen}
            onFormOpenChange={setReviewFormOpen}
          />
        </div>
      </section>

      {relatedShown.length > 0 && (
        <section className="bg-bg">
          <div className="max-w-site w-full mx-auto px-5 md:px-10 lg:px-8 py-12 md:py-16">
            <div className="mb-6 md:mb-8 flex items-end justify-between gap-4">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-ink">You may also like</h2>
              <Link href={shopLink} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-[15px] font-bold text-primary hover:underline">
                View all <span aria-hidden>→</span>
              </Link>
            </div>
            <PatternGrid variant="related">
              {relatedShown.map((p) => (
                <PatternCard key={p.id} product={p} reviewStats={carouselReviewStats.get(p.id)} />
              ))}
            </PatternGrid>
          </div>
        </section>
      )}

      {alsoBoughtShown.length > 0 && (
        <section className="border-t border-border bg-surface">
          <div className="max-w-site w-full mx-auto px-5 md:px-10 lg:px-8 py-12 md:py-16">
            <div className="mb-6 md:mb-8 flex items-end justify-between gap-4">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-ink">Customers also bought</h2>
              <Link href={shopLink} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-[15px] font-bold text-primary hover:underline">
                View all <span aria-hidden>→</span>
              </Link>
            </div>
            <PatternGrid variant="related">
              {alsoBoughtShown.map((p) => (
                <PatternCard key={p.id} product={p} reviewStats={carouselReviewStats.get(p.id)} />
              ))}
            </PatternGrid>
          </div>
        </section>
      )}

      {/* Mobile sticky buy bar */}
      {showStickyBar && !(mode !== 'owned' && product.sold_out) && (
        <div className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3">
            {mode === 'paid' && (
              <>
                <div className="min-w-0 shrink-0">
                  <p className="text-[20px] font-extrabold leading-tight text-primary">${product.price.toFixed(2)}</p>
                  {onSale && (
                    <p className="text-[13px] text-muted line-through">
                      <span className="sr-only">Was </span>${product.compare_at_price!.toFixed(2)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={toggleWishlist}
                  aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                  aria-pressed={inWishlist}
                  className="inline-flex size-[52px] shrink-0 items-center justify-center rounded-full border border-border bg-white text-ink"
                >
                  <FavoriteIcon size={20} filled={inWishlist} color={inWishlist ? 'var(--color-sale)' : 'currentColor'} />
                </button>
                {inCart ? (
                  <Link href="/cart" className={`${primaryButtonClass} flex-1`}>
                    In cart
                  </Link>
                ) : (
                  <button type="button" onClick={toggleCart} className={`${primaryButtonClass} flex-1`}>
                    Add to cart
                  </button>
                )}
              </>
            )}
            {mode === 'owned' && (
              <>
                <div className="min-w-0 shrink-0">
                  <p className="text-[13px] font-semibold text-free">Owned</p>
                  <p className="text-[15px] font-bold text-ink">In your account</p>
                </div>
                <button
                  type="button"
                  onClick={handleOwnedDownload}
                  disabled={downloadingOwned}
                  className={`${primaryButtonClass} flex-1`}
                >
                  <DownloadIcon size={20} />
                  Download PDF
                </button>
              </>
            )}
            {mode === 'free' && (
              <>
                <div className="min-w-0 shrink-0">
                  <p className="text-[20px] font-extrabold leading-tight text-free">Free</p>
                  <p className="text-[13px] text-muted">No account needed</p>
                </div>
                <button
                  type="button"
                  onClick={handleBuy}
                  disabled={downloadingFree}
                  className={`${primaryButtonClass} flex-1`}
                >
                  <DownloadIcon size={20} />
                  Download free PDF
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
