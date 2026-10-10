'use client'

import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode, type Ref } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { US_STATES } from '../lib/usStates'
import { isValidPostalCode } from '../lib/billingAddress'
import { ListRowSkeleton, ContentSkeleton, DownloadsTableSkeleton } from '../components/Skeleton'
import { useToast } from '../context/ToastContext'
import { triggerPdfDownload } from '../lib/downloads'
import { downloadOrderReceipt } from '../lib/orderReceipt'
import { MaterialIcon } from '../components/MaterialIcon'
import { LevelBadge } from '../components/ui/Badge'
import { type OrderRow } from '../components/StatusBadge'
import {
  ACCOUNT_CARD,
  AccountPageHeader,
  OrderStatusPill,
  PRIMARY_PILL,
  SECONDARY_PILL,
  SELECT_PILL,
  SupportNote,
  TEXT_LINK,
  fileLabel,
  formatMoney,
  formatShortDate,
} from '../components/account/AccountUI'
import { Wishlist } from './Wishlist'
import { OrderDetail } from './OrderDetail'
import { subscribeToNewsletter } from '../lib/newsletter'
import type { Purchase, Product } from '../lib/types'

export type { OrderRow } from '../components/StatusBadge'
export { StatusBadge } from '../components/StatusBadge'

const FILE_MISSING = "This pattern's file isn't uploaded yet — please check back soon."

type NavItem = { href: string; label: string; icon: string; match: (path: string) => boolean }

const NAV: NavItem[] = [
  { href: '/account/downloads', label: 'My downloads', icon: 'deployed_code', match: (p) => p === '/account/downloads' },
  { href: '/account/orders', label: 'Orders', icon: 'receipt_long', match: (p) => p.startsWith('/account/orders') },
  { href: '/account/wishlist', label: 'Wishlist', icon: 'favorite', match: (p) => p === '/account/wishlist' },
  {
    href: '/account/profile',
    label: 'Account settings',
    icon: 'person',
    match: (p) => p === '/account/profile' || p === '/account/addresses' || p === '/account/newsletter',
  },
]

export function Account({ hideOwnerCopyPlaceholders = false }: { hideOwnerCopyPlaceholders?: boolean }) {
  const { user, loading } = useAuth()
  const { openAuthModal } = useUI()
  const pathname = usePathname() ?? ''

  if (loading) return <ContentSkeleton />

  // Guests can browse a local wishlist; other account tabs still require sign-in.
  if (!user && pathname === '/account/wishlist') {
    return <Wishlist />
  }

  if (!user) {
    return (
      <div className="max-w-site w-full mx-auto px-5 md:px-8 py-16 md:py-24">
        <div className={`${ACCOUNT_CARD} mx-auto max-w-[560px] px-6 py-12 text-center`}>
          <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft" aria-hidden>
            <MaterialIcon name="lock" size={28} color="var(--color-primary)" />
          </span>
          <h1 className="font-heading text-[28px] md:text-[32px] font-bold text-ink">Sign in to see your account</h1>
          <p className="mx-auto mt-2 max-w-[400px] text-[16px] md:text-[15px] text-muted">
            Your downloads, orders and settings are saved to your account.
          </p>
          <button type="button" onClick={() => openAuthModal()} className={`${PRIMARY_PILL} mt-6 min-h-[52px] w-full sm:w-auto sm:min-w-[220px]`}>
            Sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-site w-full mx-auto px-5 md:px-8 pt-5 md:pt-8 pb-16">
      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-8">
        <AccountNav pathname={pathname} />
        <div className="min-w-0">
          <AccountContent hideOwnerCopyPlaceholders={hideOwnerCopyPlaceholders} />
        </div>
      </div>
    </div>
  )
}

function AccountNav({ pathname }: { pathname: string }) {
  const { signOut } = useAuth()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
    router.push('/')
  }

  return (
    <>
      <nav aria-label="Account" className={`${ACCOUNT_CARD} hidden lg:block p-3 lg:sticky lg:top-24`}>
        <ul className="space-y-1">
          {NAV.map((item) => {
            const active = item.match(pathname)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[14px] transition-colors ${
                    active ? 'bg-primary-soft font-bold text-primary' : 'font-medium text-ink hover:bg-surface-soft'
                  }`}
                >
                  <MaterialIcon name={item.icon} size={18} />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
        <div className="mt-2 border-t border-border pt-2">
          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={signingOut}
            className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-[14px] font-medium text-muted hover:bg-surface-soft hover:text-ink disabled:opacity-60"
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </nav>

      <nav aria-label="Account" className="lg:hidden -mx-5 md:-mx-8 mb-5 overflow-x-auto px-5 md:px-8" style={{ scrollbarWidth: 'none' }}>
        <ul className="flex w-max gap-2 pb-1">
          {NAV.map((item) => {
            const active = item.match(pathname)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-full border px-5 text-[15px] md:text-[14px] font-semibold transition-colors ${
                    active ? 'border-primary bg-primary text-primary-contrast' : 'border-border bg-surface text-ink hover:border-primary'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}

/** Renders account tab content based on the current URL pathname. */
function AccountContent({ hideOwnerCopyPlaceholders }: { hideOwnerCopyPlaceholders: boolean }) {
  const pathname = usePathname() ?? ''
  const router = useRouter()

  useEffect(() => {
    if (pathname === '/account' || pathname === '/account/') {
      router.replace('/account/orders')
    }
  }, [pathname, router])

  if (pathname === '/account' || pathname === '/account/') {
    return <ContentSkeleton />
  }
  if (/^\/account\/orders\/[^/]+$/.test(pathname)) return <OrderDetail embedded />
  switch (pathname) {
    case '/account/orders':
      return <MyOrders />
    case '/account/downloads':
      return <Downloads hideOwnerCopyPlaceholders={hideOwnerCopyPlaceholders} />
    case '/account/wishlist':
      return <Wishlist embedded />
    case '/account/logout':
      return <LogoutConfirm />
    case '/account/addresses':
    case '/account/newsletter':
    case '/account/profile':
      return (
        <Suspense fallback={<ContentSkeleton />}>
          <Settings />
        </Suspense>
      )
    default:
      return <MyOrders />
  }
}

function Thumb({ src, size }: { src?: string; size: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'h-12 w-12 md:h-11 md:w-11 rounded-lg' : 'h-[72px] w-[72px] md:h-16 md:w-16 rounded-xl'
  return (
    <span className={`relative block shrink-0 overflow-hidden border border-border bg-surface-soft ${cls}`} aria-hidden>
      {src && <Image src={src} alt="" fill sizes="72px" className="object-cover" />}
    </span>
  )
}

function EmptyCard({ icon, title, text, children }: { icon: string; title: string; text: string; children: ReactNode }) {
  return (
    <div className={`${ACCOUNT_CARD} px-6 py-12 md:py-14 text-center`}>
      <span className="mx-auto mb-5 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-primary-soft" aria-hidden>
        <MaterialIcon name={icon} size={34} color="var(--color-primary)" />
      </span>
      <p className="font-heading text-[24px] font-bold text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-[400px] text-[16px] md:text-[15px] leading-relaxed text-muted">{text}</p>
      <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">{children}</div>
    </div>
  )
}

function MyOrders() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Map<string, Pick<Product, 'id' | 'title' | 'slug' | 'images'>>>(new Map())
  const [receiptBusy, setReceiptBusy] = useState<string | null>(null)
  const [downloadingOrder, setDownloadingOrder] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setOrders((data as OrderRow[]) ?? []); setLoading(false) })
  }, [user])

  const productIdsKey = useMemo(
    () => [...new Set(orders.flatMap((o) => o.product_ids ?? []))].sort().join(','),
    [orders],
  )

  useEffect(() => {
    if (!productIdsKey) return
    let cancelled = false
    void (async () => {
      const { data } = await supabase.from('products').select('id, title, slug, images').in('id', productIdsKey.split(','))
      if (cancelled) return
      setProducts(new Map(((data as Pick<Product, 'id' | 'title' | 'slug' | 'images'>[]) ?? []).map((p) => [p.id, p])))
    })()
    return () => {
      cancelled = true
    }
  }, [productIdsKey])

  const viewReceipt = async (orderId: string) => {
    if (receiptBusy) return
    setReceiptBusy(orderId)
    const result = await downloadOrderReceipt(orderId)
    setReceiptBusy(null)
    if (!result.ok) showToast(result.error, 'error')
  }

  const downloadAll = async (order: OrderRow) => {
    if (downloadingOrder) return
    const items = (order.product_ids ?? []).map((id) => products.get(id)).filter((p): p is NonNullable<typeof p> => !!p)
    if (items.length === 0) return
    setDownloadingOrder(order.id)
    let failed = 0
    for (let i = 0; i < items.length; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, 700))
      const ok = await triggerPdfDownload(items[i].id, items[i].title)
      if (!ok) failed += 1
    }
    setDownloadingOrder(null)
    if (failed > 0) {
      showToast(
        failed === items.length
          ? FILE_MISSING
          : `${failed} of ${items.length} files aren't uploaded yet — please check back soon.`,
        'error',
      )
    } else {
      showToast(items.length === 1 ? 'Downloading your pattern…' : `Downloading ${items.length} patterns…`, 'success')
    }
  }

  return (
    <div>
      <AccountPageHeader title="Orders" subtitle="Every purchase, with a receipt you can download." />
      {loading ? (
        <ListRowSkeleton />
      ) : orders.length === 0 ? (
        <EmptyCard icon="receipt_long" title="No orders yet" text="Patterns you buy will show up here with their receipts.">
          <Link href="/shop" className={`${PRIMARY_PILL} min-h-[52px] sm:min-w-[200px]`}>Shop all patterns</Link>
        </EmptyCard>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => {
            const ids = o.product_ids ?? []
            const canDownload = o.status === 'paid' && ids.some((id) => products.has(id))
            const busy = downloadingOrder === o.id
            return (
              <li key={o.id} className={`${ACCOUNT_CARD} p-5 md:p-6`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[17px] md:text-[16px] font-bold text-ink">
                      <Link href={`/account/orders/${o.id}`} className="hover:text-primary hover:underline underline-offset-2">
                        Order #{o.lemon_order_id || o.id.slice(0, 8)}
                      </Link>
                    </h2>
                    <p className="mt-0.5 text-[14px] md:text-[13px] text-muted">Placed {formatShortDate(o.created_at)}</p>
                  </div>
                  <OrderStatusPill status={o.status} />
                </div>

                {ids.length > 0 && (
                  <ul className="mt-4 space-y-3">
                    {ids.map((id) => {
                      const p = products.get(id)
                      return (
                        <li key={id} className="flex items-center gap-3">
                          <Thumb src={p?.images?.[0]} size="sm" />
                          {p ? (
                            <Link href={`/pattern/${p.slug}`} className="min-w-0 text-[16px] md:text-[14px] font-medium text-ink line-clamp-2 hover:text-primary">
                              {p.title}
                            </Link>
                          ) : (
                            <span className="text-[15px] md:text-[14px] text-muted">Pattern no longer available</span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}

                <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 md:flex-row md:items-center md:justify-between">
                  <p className="flex items-baseline gap-2.5">
                    <span className="text-[15px] md:text-[14px] text-muted">Total</span>
                    <span className="text-[19px] md:text-[17px] font-bold text-ink">{formatMoney(o.amount, o.currency)}</span>
                  </p>
                  <div className="flex flex-col gap-3 md:flex-row">
                    <button
                      type="button"
                      onClick={() => void viewReceipt(o.id)}
                      disabled={receiptBusy === o.id}
                      aria-busy={receiptBusy === o.id || undefined}
                      className={SECONDARY_PILL}
                    >
                      {receiptBusy === o.id ? 'Preparing receipt…' : 'View receipt'}
                    </button>
                    {canDownload && (
                      <>
                        <Link href="/account/downloads" className={`${PRIMARY_PILL} md:hidden`}>
                          View downloads
                        </Link>
                        <button
                          type="button"
                          onClick={() => void downloadAll(o)}
                          disabled={!!downloadingOrder}
                          aria-busy={busy || undefined}
                          className={`${PRIMARY_PILL} hidden md:inline-flex`}
                        >
                          {!busy && <MaterialIcon name="download" size={18} />}
                          {busy ? 'Downloading…' : 'Download all'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

type DownloadSort = 'newest' | 'oldest' | 'name'

function Downloads({ hideOwnerCopyPlaceholders }: { hideOwnerCopyPlaceholders: boolean }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<DownloadSort>('newest')

  useEffect(() => {
    if (!user) return
    supabase
      .from('purchases')
      .select('*, product:products(*), order:orders(lemon_order_id, status, amount, currency)')
      .eq('user_id', user.id)
      .order('purchase_date', { ascending: false })
      .then(({ data }) => {
        setPurchases((data as unknown as Purchase[]) ?? [])
        setLoading(false)
      })
  }, [user])

  const download = async (productId: string, title?: string) => {
    setDownloading(productId)
    const ok = await triggerPdfDownload(productId, title)
    setDownloading(null)
    if (!ok) showToast(FILE_MISSING, 'error')
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q ? purchases.filter((p) => (p.product?.title ?? '').toLowerCase().includes(q)) : purchases
    const sorted = [...filtered]
    if (sort === 'oldest') sorted.reverse()
    if (sort === 'name') sorted.sort((a, b) => (a.product?.title ?? '').localeCompare(b.product?.title ?? ''))
    return sorted
  }, [purchases, query, sort])

  const count = purchases.length
  const header = (
    <AccountPageHeader
      title="My downloads"
      subtitle={!loading && count > 0 ? `${count} ${count === 1 ? 'pattern' : 'patterns'}. Download again anytime, no limits.` : undefined}
    />
  )

  if (loading) return <>{header}<DownloadsTableSkeleton rows={4} /></>

  if (count === 0) {
    return (
      <>
        {header}
        <EmptyCard
          icon="deployed_code"
          title="No downloads yet"
          text="Patterns you buy will appear here, ready to download anytime. Free patterns you claim show up here too."
        >
          <Link href="/shop" className={`${PRIMARY_PILL} min-h-[52px] sm:min-w-[220px]`}>Shop all patterns</Link>
          <Link href="/shop?price=free" className={`${SECONDARY_PILL} min-h-[52px]`}>Browse free patterns</Link>
        </EmptyCard>
      </>
    )
  }

  return (
    <div>
      {header}
      <div className="mb-4 flex flex-col gap-3 md:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search your patterns</span>
          <MaterialIcon name="search" size={20} color="var(--color-muted)" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your patterns"
            autoComplete="off"
            className="min-h-12 w-full rounded-full border border-border bg-surface pl-11 pr-4 text-[16px] md:text-[15px] text-ink placeholder:text-muted-light"
          />
        </label>
        <label>
          <span className="sr-only">Sort downloads</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as DownloadSort)} className={`${SELECT_PILL} min-h-12 w-full md:w-auto`}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
      </div>

      {visible.length === 0 ? (
        <p role="status" className={`${ACCOUNT_CARD} px-6 py-10 text-center text-[15px] text-muted`}>
          No patterns match &ldquo;{query.trim()}&rdquo;.
        </p>
      ) : (
        <ul className={`${ACCOUNT_CARD} px-4 md:px-5 py-1`}>
          {visible.map((p) => {
            const product = p.product
            const busy = downloading === p.product_id
            const title = product?.title ?? 'Pattern'
            return (
              <li key={p.id} className="flex flex-col gap-4 border-b border-border py-4 last:border-b-0 md:flex-row md:items-center">
                <div className="flex min-w-0 flex-1 gap-4">
                  <Thumb src={product?.images?.[0]} size="md" />
                  <div className="min-w-0">
                    {product ? (
                      <Link href={`/pattern/${product.slug}`} className="block text-[17px] md:text-[15px] font-semibold leading-snug text-ink line-clamp-2 hover:text-primary">
                        {title}
                      </Link>
                    ) : (
                      <p className="text-[17px] md:text-[15px] font-semibold text-ink">{title}</p>
                    )}
                    <div className="mt-1.5 flex flex-col items-start gap-1.5 md:flex-row md:flex-wrap md:items-center md:gap-2">
                      {product?.skill_level && <LevelBadge level={product.skill_level} />}
                      <span className="text-[14px] md:text-[12px] text-muted">
                        {fileLabel(product?.pdf_pages)} · Bought {formatShortDate(p.purchase_date)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-4">
                      {p.order_id && (
                        <Link href={`/account/orders/${p.order_id}`} className={TEXT_LINK}>View order</Link>
                      )}
                      {product && (
                        <Link href={`/pattern/${product.slug}#reviews`} className={TEXT_LINK}>Leave a review</Link>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void download(p.product_id, product?.title)}
                  disabled={busy}
                  aria-busy={busy || undefined}
                  aria-label={`Download PDF of ${title}`}
                  className={`${PRIMARY_PILL} min-h-12 w-full md:min-h-11 md:w-auto md:min-w-[160px]`}
                >
                  {!busy && <MaterialIcon name="download" size={18} />}
                  {busy ? 'Preparing…' : 'Download PDF'}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <SupportNote
        hidePlaceholder={hideOwnerCopyPlaceholders}
        lead="Can not find a pattern you bought? Check the email you used at checkout or"
      />
    </div>
  )
}

const COUNTRIES: [string, string][] = [
  ['US', 'United States'], ['GB', 'United Kingdom'], ['CA', 'Canada'], ['AU', 'Australia'],
  ['PK', 'Pakistan'], ['IN', 'India'], ['DE', 'Germany'], ['FR', 'France'], ['ES', 'Spain'],
  ['IT', 'Italy'], ['NL', 'Netherlands'], ['IE', 'Ireland'], ['NZ', 'New Zealand'],
  ['AE', 'United Arab Emirates'], ['SA', 'Saudi Arabia'], ['SG', 'Singapore'], ['MY', 'Malaysia'],
  ['PH', 'Philippines'], ['ZA', 'South Africa'], ['BR', 'Brazil'], ['MX', 'Mexico'],
  ['SE', 'Sweden'], ['NO', 'Norway'], ['DK', 'Denmark'], ['FI', 'Finland'], ['PL', 'Poland'],
  ['PT', 'Portugal'], ['BE', 'Belgium'], ['CH', 'Switzerland'], ['AT', 'Austria'], ['JP', 'Japan'],
]

const INPUT =
  'w-full min-h-12 rounded-xl border border-border bg-surface px-4 text-[16px] md:text-[15px] text-ink disabled:bg-surface-soft disabled:text-muted'
const FIELD_LABEL = 'block text-[13px] font-medium text-muted mb-1.5'
const NAME_COOLDOWN_DAYS = 7

function Settings() {
  const { user, profile, refreshProfile } = useAuth()
  const { showToast } = useToast()
  const pathname = usePathname() ?? ''
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab')
  const billingRef = useRef<HTMLElement>(null)
  const emailsRef = useRef<HTMLElement>(null)
  const [mountedAt] = useState(() => Date.now())

  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState('')
  const [newsletterOptIn, setNewsletterOptIn] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [passwordOpen, setPasswordOpen] = useState(tab === 'password')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMessage, setPwMessage] = useState<string | null>(null)

  useEffect(() => {
    const target = pathname === '/account/addresses' || tab === 'addresses'
      ? billingRef.current
      : pathname === '/account/newsletter'
        ? emailsRef.current
        : null
    target?.scrollIntoView({ block: 'start' })
  }, [pathname, tab])

  const identities = user?.identities ?? []
  const hasGoogle = identities.some((i) => i.provider === 'google')
  const hasPassword = identities.length === 0 || identities.some((i) => i.provider === 'email')

  const nameChangedAt = profile?.name_changed_at ? new Date(profile.name_changed_at).getTime() : null
  const nameUnlocksAt = nameChangedAt ? nameChangedAt + NAME_COOLDOWN_DAYS * 86400000 : null
  const nameEditLocked = nameUnlocksAt !== null && nameUnlocksAt > mountedAt
  const nameUnlockLabel = nameUnlocksAt
    ? new Date(nameUnlocksAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : ''

  const startEditingName = () => {
    if (nameEditLocked) return
    setName(profile?.name ?? '')
    setEditingName(true)
  }

  const nameDirty = editingName && !nameEditLocked && name.trim() !== (profile?.name ?? '').trim()
  const newsletterPending = newsletterOptIn && !subscribed
  const canSave = (nameDirty || newsletterPending) && !saving

  const saveChanges = async () => {
    if (!user || !canSave) return
    setSaving(true)
    setSaveError(null)
    const errors: string[] = []

    if (nameDirty) {
      const { error } = await supabase.from('profiles').update({
        name: name.trim() || null,
        name_changed_at: new Date().toISOString(),
      }).eq('id', user.id)
      await refreshProfile()
      if (error) errors.push("Couldn't update your name — please try again.")
      else setEditingName(false)
    }

    // Opt-in only: this never unsubscribes anyone.
    if (newsletterPending && user.email) {
      const { ok, error } = await subscribeToNewsletter(user.email)
      if (ok) setSubscribed(true)
      else errors.push(error ?? "Couldn't subscribe.")
    }

    setSaving(false)
    if (errors.length > 0) {
      setSaveError(errors.join(' '))
      showToast(errors[0], 'error')
    } else {
      showToast('Changes saved.', 'success')
    }
  }

  const closePassword = () => {
    setPasswordOpen(false)
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPwMessage(null)
  }

  const changePassword = async () => {
    setPwMessage(null)
    if (!oldPassword) { setPwMessage('Enter your current password.'); return }
    if (newPassword.length < 8) { setPwMessage('New password must be at least 8 characters.'); return }
    if (newPassword !== confirmPassword) { setPwMessage("New passwords don't match."); return }
    setPwSaving(true)

    const { error: verifyError } = await supabase.auth.signInWithPassword({ email: user!.email!, password: oldPassword })
    if (verifyError) {
      setPwSaving(false)
      showToast('Current password is incorrect.', 'error')
      setPwMessage('Current password is incorrect.')
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwSaving(false)
    if (error) { showToast(error.message, 'error'); setPwMessage(error.message); return }
    closePassword()
    showToast('Password updated.', 'success')
  }

  const rowCls = 'flex items-start justify-between gap-4 border-b border-border py-4 last:border-b-0'

  return (
    <div>
      <AccountPageHeader title="Account settings" subtitle="Your details and preferences." />

      <div className="space-y-4">
        <section aria-labelledby="profile-title" className={`${ACCOUNT_CARD} px-5 md:px-6 pt-5 pb-1`}>
          <h2 id="profile-title" className="text-[20px] md:text-[18px] font-bold text-ink">Profile</h2>
          <div className="mt-1">
            <div className={rowCls}>
              <div className="min-w-0 flex-1">
                {editingName ? (
                  <>
                    <label htmlFor="settings-name" className={FIELD_LABEL}>Name</label>
                    <input
                      id="settings-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      placeholder="Optional"
                      aria-describedby="settings-name-hint"
                      className={INPUT}
                    />
                    <p id="settings-name-hint" className="mt-1.5 text-[13px] text-muted">
                      You can change your name once every {NAME_COOLDOWN_DAYS} days. Press Save changes to keep it.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[13px] font-medium text-muted">Name</p>
                    <p className="mt-0.5 text-[16px] md:text-[15px] text-ink">
                      {profile?.name?.trim() || <span className="text-muted">Not set</span>}
                    </p>
                    {nameEditLocked && (
                      <p id="settings-name-locked" className="mt-1 text-[13px] text-muted">
                        You can change your name again on {nameUnlockLabel}.
                      </p>
                    )}
                  </>
                )}
              </div>
              {editingName ? (
                <button type="button" onClick={() => setEditingName(false)} className={`${TEXT_LINK} shrink-0 px-1 mt-6`}>
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startEditingName}
                  disabled={nameEditLocked}
                  aria-describedby={nameEditLocked ? 'settings-name-locked' : undefined}
                  aria-label="Edit name"
                  className={`${TEXT_LINK} shrink-0 px-1 disabled:cursor-not-allowed disabled:text-muted-light disabled:no-underline`}
                >
                  Edit
                </button>
              )}
            </div>

            <div className={rowCls}>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-muted">Email</p>
                <p className="mt-0.5 break-all text-[16px] md:text-[15px] text-ink">{user?.email}</p>
                <p className="mt-1 text-[13px] text-muted">
                  To change your email,{' '}
                  <Link href="/contact" className="text-primary underline underline-offset-2 hover:text-primary-hover">contact us</Link>.
                </p>
              </div>
            </div>

            {hasPassword && (
              <div className={`${rowCls} flex-col !items-stretch`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-medium text-muted">Password</p>
                    <p className="mt-0.5 text-[16px] tracking-[0.2em] text-ink" aria-label="Password set">••••••••</p>
                  </div>
                  {!passwordOpen && (
                    <button type="button" onClick={() => setPasswordOpen(true)} aria-label="Change password" className={`${TEXT_LINK} shrink-0 px-1`}>
                      Change
                    </button>
                  )}
                </div>
                {passwordOpen && (
                  <form
                    className="mt-3 max-w-[420px] space-y-3"
                    onSubmit={(e) => { e.preventDefault(); void changePassword() }}
                  >
                    <div>
                      <label htmlFor="pw-current" className={FIELD_LABEL}>Current password</label>
                      <input id="pw-current" type="password" autoComplete="current-password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className={INPUT} />
                    </div>
                    <div>
                      <label htmlFor="pw-new" className={FIELD_LABEL}>New password</label>
                      <input id="pw-new" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={INPUT} />
                    </div>
                    <div>
                      <label htmlFor="pw-confirm" className={FIELD_LABEL}>Confirm new password</label>
                      <input id="pw-confirm" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={INPUT} />
                    </div>
                    {pwMessage && <p role="alert" className="text-[13px] text-error">{pwMessage}</p>}
                    <div className="flex flex-wrap items-center gap-3 pt-1 pb-2">
                      <button type="submit" disabled={pwSaving} className={PRIMARY_PILL}>
                        {pwSaving ? 'Updating…' : 'Update password'}
                      </button>
                      <button type="button" onClick={closePassword} className={`${TEXT_LINK} px-2`}>Cancel</button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </section>

        <section ref={emailsRef} aria-labelledby="emails-title" className={`${ACCOUNT_CARD} scroll-mt-24 px-5 md:px-6 py-5`}>
          <h2 id="emails-title" className="text-[20px] md:text-[18px] font-bold text-ink">Sign-in and emails</h2>
          {hasGoogle && (
            <div className="mt-3 flex min-h-11 items-center gap-3 border-b border-border pb-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success-bg" aria-hidden>
                <MaterialIcon name="check" size={14} color="var(--color-free)" />
              </span>
              <span className="text-[16px] md:text-[15px] font-medium text-ink">Google</span>
              <span className="text-[13px] font-bold text-free">Connected</span>
            </div>
          )}
          <div className={hasGoogle ? 'mt-4' : 'mt-3'}>
            {subscribed ? (
              <p role="status" className="flex items-center gap-2 text-[15px] text-ink">
                <MaterialIcon name="check_circle" size={18} color="var(--color-free)" />
                You&apos;re subscribed with {user?.email}.
              </p>
            ) : (
              <label className="flex min-h-11 cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={newsletterOptIn}
                  onChange={(e) => setNewsletterOptIn(e.target.checked)}
                  aria-describedby="newsletter-note"
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-primary)]"
                />
                <span className="text-[16px] md:text-[15px] text-ink">Send me news about new patterns and offers</span>
              </label>
            )}
            <p id="newsletter-note" className="mt-1 pl-8 text-[13px] leading-relaxed text-muted">
              Order receipts and download links are always sent. Every newsletter email has an unsubscribe link.
            </p>
          </div>
        </section>

        <div className="flex flex-col items-stretch gap-2 md:items-end">
          {saveError && <p role="alert" className="text-[13px] text-error md:text-right">{saveError}</p>}
          <button
            type="button"
            onClick={() => void saveChanges()}
            disabled={!canSave}
            aria-busy={saving || undefined}
            className={`${PRIMARY_PILL} min-h-[52px] md:min-w-[180px]`}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>

        <BillingAddressCard
          key={[profile?.billing_country, profile?.billing_address_line1, profile?.billing_city, profile?.billing_state, profile?.billing_zip].join('|')}
          sectionRef={billingRef}
        />
      </div>
    </div>
  )
}

function BillingAddressCard({ sectionRef }: { sectionRef: Ref<HTMLElement> }) {
  const { user, profile, refreshProfile } = useAuth()
  const { showToast } = useToast()
  const [billingCountry, setBillingCountry] = useState(profile?.billing_country ?? '')
  const [billingAddressLine1, setBillingAddressLine1] = useState(profile?.billing_address_line1 ?? '')
  const [billingCity, setBillingCity] = useState(profile?.billing_city ?? '')
  const [billingState, setBillingState] = useState(profile?.billing_state ?? '')
  const [billingZip, setBillingZip] = useState(profile?.billing_zip ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [touched, setTouched] = useState(false)
  const [editing, setEditing] = useState(!profile?.billing_country)

  const isUS = billingCountry === 'US'
  const zipValid = billingZip.trim() === '' || isValidPostalCode(billingCountry, billingZip)
  const addressValid = isUS
    ? !!(billingAddressLine1.trim() && billingCity.trim() && billingState.trim() && isValidPostalCode('US', billingZip))
    : !billingCountry || isValidPostalCode(billingCountry, billingZip)

  const save = async () => {
    if (!user) return
    setTouched(true)
    if (billingCountry && !addressValid) return
    setSaving(true)
    setSaved(false)
    await supabase.from('profiles').update({
      billing_country: billingCountry || null,
      billing_address_line1: isUS ? (billingAddressLine1 || null) : null,
      billing_city: isUS ? (billingCity || null) : null,
      billing_state: isUS ? (billingState || null) : null,
      billing_zip: billingZip || null,
    }).eq('id', user.id)
    await refreshProfile()
    setSaving(false)
    setSaved(true)
    setEditing(false)
    showToast('Billing address saved.', 'success')
  }

  const hasAddress = !!profile?.billing_country
  const countryLabel = COUNTRIES.find(([code]) => code === profile?.billing_country)?.[1] ?? profile?.billing_country

  return (
    <section ref={sectionRef} aria-labelledby="billing-title" className={`${ACCOUNT_CARD} scroll-mt-24 px-5 md:px-6 py-5`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="billing-title" className="text-[20px] md:text-[18px] font-bold text-ink">Billing address</h2>
          <p className="mt-1 text-[14px] md:text-[13px] text-muted">Saved here fills in automatically at checkout.</p>
        </div>
        {hasAddress && !editing && (
          <button type="button" onClick={() => setEditing(true)} aria-label="Edit billing address" className={`${TEXT_LINK} shrink-0 px-1`}>
            Edit
          </button>
        )}
      </div>

      {hasAddress && !editing && (
        <div className="mt-3 space-y-0.5 text-[15px] md:text-[14px] leading-relaxed text-ink">
          {profile?.billing_country === 'US' ? (
            <>
              {profile.billing_address_line1 && <p>{profile.billing_address_line1}</p>}
              <p>{[profile.billing_city, profile.billing_state, profile.billing_zip].filter(Boolean).join(', ')}</p>
            </>
          ) : (
            profile?.billing_zip && <p>{profile.billing_zip}</p>
          )}
          <p>{countryLabel}</p>
          {saved && <p role="status" className="pt-1 text-[13px] text-free">Saved.</p>}
        </div>
      )}

      {(editing || !hasAddress) && (
        <form className="mt-4 max-w-[480px] space-y-3" onSubmit={(e) => { e.preventDefault(); void save() }}>
          <div>
            <label htmlFor="billing-country" className={FIELD_LABEL}>Country</label>
            <select
              id="billing-country"
              autoComplete="country"
              value={billingCountry}
              onChange={(e) => { setBillingCountry(e.target.value); setSaved(false); setTouched(false) }}
              className={INPUT}
            >
              <option value="">Select a country</option>
              {COUNTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
          </div>
          {isUS ? (
            <>
              <div>
                <label htmlFor="billing-line1" className={FIELD_LABEL}>Address line 1</label>
                <input id="billing-line1" autoComplete="address-line1" value={billingAddressLine1} onChange={(e) => { setBillingAddressLine1(e.target.value); setSaved(false) }} className={INPUT} />
              </div>
              <div>
                <label htmlFor="billing-state" className={FIELD_LABEL}>State</label>
                <select id="billing-state" autoComplete="address-level1" value={billingState} onChange={(e) => { setBillingState(e.target.value); setSaved(false) }} className={INPUT}>
                  <option value="">Select a state…</option>
                  {US_STATES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="billing-city" className={FIELD_LABEL}>City</label>
                  <input id="billing-city" autoComplete="address-level2" value={billingCity} onChange={(e) => { setBillingCity(e.target.value); setSaved(false) }} className={INPUT} />
                </div>
                <div>
                  <label htmlFor="billing-zip" className={FIELD_LABEL}>ZIP</label>
                  <input id="billing-zip" autoComplete="postal-code" value={billingZip} onChange={(e) => { setBillingZip(e.target.value); setSaved(false) }} className={INPUT} />
                </div>
              </div>
              {touched && !addressValid && (
                <p role="alert" className="text-[13px] text-error">Enter your full address, city, state and a valid ZIP.</p>
              )}
            </>
          ) : billingCountry ? (
            <div>
              <label htmlFor="billing-postal" className={FIELD_LABEL}>Postal code</label>
              <input id="billing-postal" autoComplete="postal-code" value={billingZip} onChange={(e) => { setBillingZip(e.target.value); setSaved(false) }} aria-invalid={touched && !zipValid ? true : undefined} className={INPUT} />
              {touched && !zipValid && <p role="alert" className="mt-1 text-[13px] text-error">Enter a valid postal code.</p>}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button type="submit" disabled={saving} className={SECONDARY_PILL}>
              {saving ? 'Saving…' : 'Save address'}
            </button>
            {hasAddress && <button type="button" onClick={() => setEditing(false)} className={`${TEXT_LINK} px-2`}>Cancel</button>}
          </div>
        </form>
      )}
    </section>
  )
}

function LogoutConfirm() {
  const { signOut } = useAuth()
  return (
    <div className={`${ACCOUNT_CARD} mx-auto max-w-[520px] px-6 py-12 text-center`}>
      <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft" aria-hidden>
        <MaterialIcon name="logout" size={28} color="var(--color-primary)" />
      </span>
      <h1 className="font-heading text-[28px] md:text-[32px] font-bold text-ink">Sign out</h1>
      <p className="mt-2 text-[16px] md:text-[15px] text-muted">Are you sure you want to sign out of your Notion Creative Art account?</p>
      <div className="mt-6 flex flex-col items-center gap-2">
        <button type="button" onClick={signOut} className={`${PRIMARY_PILL} min-h-[52px] w-full sm:w-auto sm:min-w-[220px]`}>
          Sign out
        </button>
        <Link href="/account/downloads" className={TEXT_LINK}>Cancel, stay signed in</Link>
      </div>
    </div>
  )
}
