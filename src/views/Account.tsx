'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { deriveVariantUrl } from '../lib/imageVariants'
import { useAuth } from '../context/AuthContext'
import { US_STATES } from '../lib/usStates'
import { isValidPostalCode } from '../lib/billingAddress'
import { EmptyState } from '../components/EmptyState'
import { ProductGridSkeleton, ListRowSkeleton, ContentSkeleton } from '../components/Skeleton'
import { useToast } from '../context/ToastContext'
import { triggerPdfDownload } from '../lib/downloads'
import { MaterialIcon } from '../components/MaterialIcon'
import type { Purchase, Product } from '../lib/types'

export type OrderRow = {
  id: string
  lemon_order_id: string
  amount: number
  currency: string
  status: string
  product_ids: string[]
  created_at: string
}

const BRAND = '#0f3fc9'
const BRAND_SOFT = '#e8eefc'

const NAV_ITEMS: { to: string; label: string; icon: string; end?: boolean }[] = [
  { to: '/account', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/account/orders', label: 'Orders', icon: 'receipt_long' },
  { to: '/account/downloads', label: 'Downloads', icon: 'download' },
  { to: '/wishlist', label: 'Wishlist', icon: 'favorite' },
  { to: '/account/profile', label: 'Account Settings', icon: 'settings' },
]

export function Account() {
  const { user, profile, signOut, loading } = useAuth()
  const pathname = usePathname()

  if (loading) return <ContentSkeleton />
  if (!user) {
    return (
      <div className="max-w-[1400px] mx-auto px-8 py-32 text-center">
        <p className="font-subheading text-2xl mb-4">Sign in to view your account.</p>
        <Link href="/" className="text-[12px] tracking-[0.12em] border-b border-ink pb-1">BACK TO HOME →</Link>
      </div>
    )
  }

  const firstName = profile?.first_name

  return (
    <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 lg:px-16 py-8 md:py-10 pb-16">
      <nav className="flex items-center gap-2 text-[12px] text-ink-soft mb-6 flex-wrap" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>›</span>
        <span className="text-ink">My Account</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-8 lg:gap-10 items-start">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 space-y-4">
          <nav className="bg-white border border-line rounded-2xl p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible" style={{ scrollbarWidth: 'none' }}>
            {NAV_ITEMS.map((t) => {
              const active = t.end
                ? pathname === '/account'
                : t.to === '/wishlist'
                  ? pathname === '/wishlist'
                  : pathname === t.to || pathname.startsWith(t.to + '/')
              return (
                <Link
                  key={t.to + t.label}
                  href={t.to}
                  className={`shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] transition-colors ${
                    active ? 'font-medium' : 'text-ink-soft hover:text-ink hover:bg-surface'
                  }`}
                  style={active ? { background: BRAND_SOFT, color: BRAND } : undefined}
                >
                  <MaterialIcon name={t.icon} size={18} color={active ? BRAND : 'var(--color-ink-soft)'} />
                  {t.label}
                </Link>
              )
            })}
            <button
              onClick={signOut}
              className="shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] text-ink-soft hover:text-madder hover:bg-surface text-left w-full"
            >
              <MaterialIcon name="logout" size={18} />
              Log Out
            </button>
          </nav>

          <div className="hidden lg:block rounded-2xl p-5" style={{ background: BRAND_SOFT }}>
            <div className="flex items-center gap-2 mb-2">
              <MaterialIcon name="support_agent" size={20} color={BRAND} />
              <p className="text-[14px] font-semibold text-ink">Need Help?</p>
            </div>
            <p className="text-[12px] text-ink-soft mb-4 leading-relaxed">Questions about downloads or orders? We&apos;re happy to help.</p>
            <Link
              href="/contact"
              className="block text-center w-full py-2.5 text-canvas text-[11px] tracking-[0.1em] font-semibold rounded-lg hover:opacity-90 transition-opacity"
              style={{ background: BRAND }}
            >
              CONTACT SUPPORT
            </Link>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0">
          {(pathname === '/account' || pathname === '/account/') && (
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="font-heading font-semibold text-3xl md:text-4xl text-ink mb-1.5">My Account</h1>
                <p className="text-[14px] text-ink-soft">
                  {firstName
                    ? `Welcome back, ${firstName}! Here's what's happening with your account.`
                    : "Here's what's happening with your account."}
                </p>
              </div>
            </div>
          )}
          <AccountContent />
        </div>
      </div>
    </div>
  )
}

/** Renders account tab content based on the current URL pathname. */
function AccountContent() {
  const pathname = usePathname()
  switch (pathname) {
    case '/account/orders':
      return <MyOrders />
    case '/account/downloads':
      return <Downloads />
    case '/account/profile':
      return <ProfileTab />
    default:
      return <Dashboard />
  }
}

function Dashboard() {
  const { user } = useAuth()
  const [totalOrders, setTotalOrders] = useState<number | null>(null)
  const [downloads, setDownloads] = useState<number | null>(null)
  const [wishlistCount, setWishlistCount] = useState<number | null>(null)
  const [completedOrders, setCompletedOrders] = useState<number | null>(null)
  const [recent, setRecent] = useState<OrderRow[]>([])
  const [recentDownloads, setRecentDownloads] = useState<Purchase[]>([])
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', user.id).then(({ count }) => setTotalOrders(count ?? 0))
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'paid').then(({ count }) => setCompletedOrders(count ?? 0))
    supabase.from('purchases').select('id', { count: 'exact', head: true }).eq('user_id', user.id).then(({ count }) => setDownloads(count ?? 0))
    supabase.from('wishlist').select('product_id', { count: 'exact', head: true }).eq('user_id', user.id).then(({ count }) => setWishlistCount(count ?? 0))
    supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setRecent((data as OrderRow[]) ?? []))
    supabase
      .from('purchases')
      .select('*, product:products(*)')
      .eq('user_id', user.id)
      .order('purchase_date', { ascending: false })
      .limit(4)
      .then(({ data }) => setRecentDownloads((data as unknown as Purchase[]) ?? []))
  }, [user])

  const download = async (productId: string, title?: string) => {
    setDownloading(productId)
    const ok = await triggerPdfDownload(productId, title)
    setDownloading(null)
    if (!ok) alert("This pattern's file isn't uploaded yet — please check back soon.")
  }

  const stats = [
    { label: 'Total Orders', value: totalOrders, icon: 'shopping_bag', href: '/account/orders', cta: 'View your order history' },
    { label: 'Total Downloads', value: downloads, icon: 'download', href: '/account/downloads', cta: 'View your downloads' },
    { label: 'Wishlist Items', value: wishlistCount, icon: 'favorite', href: '/wishlist', cta: 'View your wishlist' },
    { label: 'Completed Orders', value: completedOrders, icon: 'check_circle', href: '/account/orders', cta: 'See completed orders' },
  ]

  const quickLinks = [
    { href: '/shop', icon: 'storefront', title: 'Browse Patterns', desc: 'Explore the full shop' },
    { href: '/shop?price=free', icon: 'redeem', title: 'Free Patterns', desc: 'Start stitching for free' },
    { href: '/account/downloads', icon: 'folder_open', title: 'My Downloads', desc: 'Re-download your PDFs' },
    { href: '/account/profile', icon: 'person', title: 'Edit Profile', desc: 'Update your details' },
    { href: '/account/profile#billing', icon: 'location_on', title: 'Addresses', desc: 'Billing information' },
    { href: '/contact', icon: 'mail', title: 'Support', desc: 'Get help from us' },
  ]

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-line rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="w-9 h-9 rounded-full flex items-center justify-center mb-3" style={{ background: BRAND_SOFT }}>
              <MaterialIcon name={s.icon} size={18} color={BRAND} />
            </div>
            <p className="text-[12px] text-ink-soft mb-1">{s.label}</p>
            <p className="text-[28px] font-semibold font-subheading leading-none mb-3">{s.value ?? '—'}</p>
            <Link href={s.href} className="text-[12px] font-medium hover:opacity-80 inline-flex items-center gap-0.5" style={{ color: BRAND }}>
              {s.cta} <span aria-hidden>→</span>
            </Link>
          </div>
        ))}
      </div>

      {/* Recent orders + quick links */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] gap-6">
        <div className="bg-white border border-line rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-subheading font-semibold text-lg">Recent Orders</h2>
          </div>
          {recent.length === 0 ? (
            <p className="text-[13px] text-ink-soft py-6 text-center">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-[13px] min-w-[480px]">
                <thead>
                  <tr className="text-left text-[11px] tracking-[0.06em] text-ink-soft border-b border-line">
                    <th className="pb-2.5 font-medium">Order</th>
                    <th className="pb-2.5 font-medium">Date</th>
                    <th className="pb-2.5 font-medium">Items</th>
                    <th className="pb-2.5 font-medium">Total</th>
                    <th className="pb-2.5 font-medium">Status</th>
                    <th className="pb-2.5 font-medium w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {recent.map((o) => (
                    <tr key={o.id} className="hover:bg-surface/60">
                      <td className="py-3.5 font-medium">#{o.lemon_order_id || o.id.slice(0, 8)}</td>
                      <td className="py-3.5 text-ink-soft">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td className="py-3.5 text-ink-soft">{o.product_ids?.length ?? 0}</td>
                      <td className="py-3.5 font-medium">${o.amount.toFixed(2)}</td>
                      <td className="py-3.5"><StatusBadge status={o.status} /></td>
                      <td className="py-3.5 text-right">
                        <Link href={`/account/orders/${o.id}`} aria-label="View order" className="inline-flex text-ink-soft hover:text-ink">
                          <MaterialIcon name="chevron_right" size={18} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-5 pt-4 border-t border-line flex justify-center">
            <Link
              href="/account/orders"
              className="px-6 py-2.5 text-[11px] tracking-[0.1em] font-semibold border border-line rounded-lg hover:bg-surface transition-colors"
            >
              VIEW ALL ORDERS
            </Link>
          </div>
        </div>

        <div className="bg-white border border-line rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h2 className="font-subheading font-semibold text-lg mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {quickLinks.map((q) => (
              <Link
                key={q.href + q.title}
                href={q.href}
                className="rounded-xl border border-line p-3.5 hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-colors group"
              >
                <MaterialIcon name={q.icon} size={20} color={BRAND} />
                <p className="text-[13px] font-medium mt-2 text-ink group-hover:text-[var(--color-accent)]">{q.title}</p>
                <p className="text-[11px] text-ink-soft mt-0.5 leading-snug">{q.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recently downloaded */}
      <div className="bg-white border border-line rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-subheading font-semibold text-lg">Recently Downloaded</h2>
          <Link href="/account/downloads" className="text-[12px] font-medium hover:opacity-80" style={{ color: BRAND }}>
            View all →
          </Link>
        </div>
        {recentDownloads.length === 0 ? (
          <p className="text-[13px] text-ink-soft text-center py-8">Your pattern downloads will show up here.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {recentDownloads.map((p) => {
              const product = p.product as Product | undefined
              return (
                <div key={p.id} className="flex gap-3 items-center rounded-xl border border-line p-2.5">
                  <Link href={product ? `/pattern/${product.slug}` : '#'} className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-surface">
                    {product?.images?.[0] && (
                      <img src={deriveVariantUrl(product.images[0], 'micro')} alt={product.title} loading="lazy" className="w-full h-full object-cover" />
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={product ? `/pattern/${product.slug}` : '#'} className="block text-[12px] font-medium truncate hover:underline">
                      {product?.title ?? 'Pattern'}
                    </Link>
                    <p className="text-[10px] text-ink-soft mt-0.5">Crochet Pattern PDF</p>
                    <p className="text-[10px] text-ink-soft">{new Date(p.purchase_date).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => download(p.product_id, product?.title)}
                    disabled={downloading === p.product_id}
                    aria-label="Download PDF"
                    className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center hover:opacity-90 disabled:opacity-50"
                    style={{ background: BRAND_SOFT }}
                  >
                    <MaterialIcon name="download" size={16} color={BRAND} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const style =
    status === 'paid' ? { background: BRAND_SOFT, color: BRAND } :
    status === 'refunded' ? { background: '#F5E6E6', color: 'var(--color-madder)' } :
    { background: 'var(--color-surface)', color: 'var(--color-ink-soft)' }
  const label = status === 'paid' ? 'Completed' : status === 'refunded' ? 'Refunded' : 'Pending'
  return <span className="text-[10px] tracking-wide px-2.5 py-1 rounded-full font-medium" style={style}>{label}</span>
}

function MyOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'refunded'>('all')

  useEffect(() => {
    if (!user) return
    supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setOrders((data as OrderRow[]) ?? []); setLoading(false) })
  }, [user])

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  if (loading) return <ListRowSkeleton />

  return (
    <div>
      <div className="flex gap-6 border-b border-line mb-6 text-[12px] tracking-[0.08em]">
        {(['all', 'paid', 'pending', 'refunded'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`pb-3 border-b-2 -mb-px ${filter === f ? 'border-ink text-ink' : 'border-transparent text-ink-soft hover:text-ink'}`}
          >
            {f === 'all' ? 'ALL ORDERS' : f.toUpperCase()}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        orders.length === 0 ? (
          <EmptyState
            icon="receipt_long"
            title="Your purchases will appear here."
            subtitle="Once you complete an order, you'll be able to track it and access your downloads from this page."
            actionLabel="Start Shopping"
            actionTo="/shop"
          />
        ) : (
          <p className="text-[13px] text-ink-soft">No orders in this view.</p>
        )
      ) : (
        <div className="bg-white border border-line rounded-2xl divide-y divide-line overflow-hidden">
          {filtered.map((o) => (
            <div key={o.id} className="px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-[13px] font-medium">Order #{o.lemon_order_id}</p>
                  <p className="text-[11px] text-ink-soft mt-0.5">{new Date(o.created_at).toLocaleDateString()} · {o.product_ids?.length ?? 0} item{(o.product_ids?.length ?? 0) === 1 ? '' : 's'}</p>
                </div>
                <span className="text-[13px] font-medium shrink-0">${o.amount.toFixed(2)}</span>
                <StatusBadge status={o.status} />
                <Link
                  href={`/account/orders/${o.id}`}
                  className="text-[11px] text-ink-soft hover:text-ink underline underline-offset-2 shrink-0"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Downloads() {
  const { user } = useAuth()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)

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
    if (!ok) alert("This pattern's file isn't uploaded yet — please check back soon.")
  }

  if (loading) return <ProductGridSkeleton count={6} />
  if (purchases.length === 0) return (
    <EmptyState
      icon="download"
      title="Your downloads will appear here."
      subtitle="Once you purchase a pattern, you'll be able to download the PDF anytime from this page."
      actionLabel="Start Shopping"
      actionTo="/shop"
    />
  )

  return (
    <div className="border border-line rounded-2xl overflow-hidden bg-white divide-y divide-line">
      {purchases.map((p) => (
        <div key={p.id} className="flex items-center gap-4 p-3">
          <Link href={p.product ? `/pattern/${p.product.slug}` : '#'} className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-surface">
            {p.product?.images?.[0] ? (
              <img src={deriveVariantUrl(p.product.images[0], 'micro')} alt={p.product.title} loading="lazy" className="w-full h-full object-cover" />
            ) : null}
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={p.product ? `/pattern/${p.product.slug}` : '#'} className="block text-[13px] font-medium truncate hover:underline underline-offset-2">
              {p.product?.title}
            </Link>
            <p className="text-[11px] text-ink-soft">Purchased {new Date(p.purchase_date).toLocaleDateString()}</p>
          </div>
          <button
            onClick={() => download(p.product_id, p.product?.title)}
            disabled={downloading === p.product_id}
            className="shrink-0 px-4 py-2 text-canvas text-[11px] font-semibold tracking-[0.06em] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ background: 'var(--color-accent)' }}
          >
            {downloading === p.product_id ? '…' : 'DOWNLOAD'}
          </button>
        </div>
      ))}
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

function ProfileTab() {
  const { user, profile, refreshProfile } = useAuth()
  const { showToast } = useToast()
  const [firstName, setFirstName] = useState(profile?.first_name ?? '')
  const [lastName, setLastName] = useState(profile?.last_name ?? '')
  const [editingName, setEditingName] = useState(false)
  const [nameSaving, setNameSaving] = useState(false)
  const [billingCountry, setBillingCountry] = useState(profile?.billing_country ?? '')
  const [billingAddressLine1, setBillingAddressLine1] = useState(profile?.billing_address_line1 ?? '')
  const [billingCity, setBillingCity] = useState(profile?.billing_city ?? '')
  const [billingState, setBillingState] = useState(profile?.billing_state ?? '')
  const [billingZip, setBillingZip] = useState(profile?.billing_zip ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [touched, setTouched] = useState(false)

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMessage, setPwMessage] = useState<string | null>(null)

  useEffect(() => {
    setFirstName(profile?.first_name ?? '')
    setLastName(profile?.last_name ?? '')
    setBillingCountry(profile?.billing_country ?? '')
    setBillingAddressLine1(profile?.billing_address_line1 ?? '')
    setBillingCity(profile?.billing_city ?? '')
    setBillingState(profile?.billing_state ?? '')
    setBillingZip(profile?.billing_zip ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.first_name, profile?.last_name, profile?.billing_country, profile?.billing_address_line1, profile?.billing_city, profile?.billing_state, profile?.billing_zip])

  const NAME_COOLDOWN_DAYS = 7
  const daysSinceNameChange = profile?.name_changed_at ? (Date.now() - new Date(profile.name_changed_at).getTime()) / 86400000 : Infinity
  const nameCooldownDaysLeft = Math.max(0, Math.ceil(NAME_COOLDOWN_DAYS - daysSinceNameChange))
  const nameEditLocked = nameCooldownDaysLeft > 0

  const startEditingName = () => {
    if (nameEditLocked) {
      showToast(`You can change your name again in ${nameCooldownDaysLeft} day${nameCooldownDaysLeft === 1 ? '' : 's'}.`, 'error')
      return
    }
    setEditingName(true)
    showToast('You can change your name once every 7 days — make sure it\'s right.', 'info')
  }

  const cancelEditingName = () => {
    setFirstName(profile?.first_name ?? '')
    setLastName(profile?.last_name ?? '')
    setEditingName(false)
  }

  const saveName = async () => {
    if (!user) return
    setNameSaving(true)
    const { error } = await supabase.from('profiles').update({
      first_name: firstName || null,
      last_name: lastName || null,
      name_changed_at: new Date().toISOString(),
    }).eq('id', user.id)
    await refreshProfile()
    setNameSaving(false)
    if (error) { showToast("Couldn't update your name — please try again.", 'error'); return }
    setEditingName(false)
    showToast('Name updated.', 'success')
  }

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
  }

  const changePassword = async () => {
    setPwMessage(null)
    if (!oldPassword) { setPwMessage('Enter your current password.'); return }
    if (newPassword.length < 8) { setPwMessage('New password must be at least 8 characters.'); return }
    if (newPassword !== confirmPassword) { setPwMessage("New passwords don't match."); return }
    setPwSaving(true)

    // Verify the current password by re-authenticating before allowing a change.
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
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPwMessage(null)
    showToast('Password updated.', 'success')
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-12">
      <div className="max-w-sm space-y-5 text-[13px]">
        <p className="text-[11px] tracking-[0.15em] text-ink-soft">PERSONAL INFORMATION</p>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="block text-ink-soft text-[11px] tracking-[0.1em]">FIRST NAME</span>
            {!editingName && (
              <button onClick={startEditingName} className="text-[11px] tracking-[0.08em] text-ink underline underline-offset-2 hover:opacity-70">
                EDIT YOUR NAME
              </button>
            )}
          </div>
          <input
            value={firstName}
            disabled={!editingName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full border border-line px-3 py-2.5 text-[13px] bg-canvas focus:outline-none focus:border-ink rounded-lg disabled:bg-surface disabled:text-ink-soft"
          />
        </div>
        <label className="block">
          <span className="block text-ink-soft text-[11px] tracking-[0.1em] mb-1.5">LAST NAME</span>
          <input
            value={lastName}
            disabled={!editingName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full border border-line px-3 py-2.5 text-[13px] bg-canvas focus:outline-none focus:border-ink rounded-lg disabled:bg-surface disabled:text-ink-soft"
          />
        </label>
        {editingName && (
          <div className="flex items-center gap-3">
            <button
              onClick={saveName}
              disabled={nameSaving}
              className="px-5 py-2 bg-ink text-canvas text-[11px] tracking-[0.1em] rounded-lg hover:opacity-85 transition-opacity disabled:opacity-50"
            >
              {nameSaving ? 'SAVING…' : 'SAVE NAME'}
            </button>
            <button onClick={cancelEditingName} className="text-[11px] tracking-[0.1em] text-ink-soft hover:text-ink">CANCEL</button>
          </div>
        )}
        {!editingName && nameEditLocked && (
          <p className="text-[11px] text-ink-soft">You can change your name again in {nameCooldownDaysLeft} day{nameCooldownDaysLeft === 1 ? '' : 's'}.</p>
        )}
        <div>
          <p className="text-ink-soft text-[11px] tracking-[0.1em] mb-1">EMAIL</p>
          <p>{user?.email}</p>
          <p className="text-ink-soft text-[11px] mt-1">Contact support to change your email address.</p>
        </div>
        <div className="pt-2 border-t border-line" id="billing">
          <p className="text-ink-soft text-[11px] tracking-[0.1em] mb-3 pt-4">BILLING ADDRESS <span className="normal-case text-ink-soft/80">— saved here fills in automatically at checkout</span></p>
          <div className="space-y-4">
            <label className="block">
              <span className="block text-ink-soft text-[11px] tracking-[0.1em] mb-1.5">COUNTRY</span>
              <select
                value={billingCountry}
                onChange={(e) => { setBillingCountry(e.target.value); setSaved(false); setTouched(false) }}
                className="w-full border border-line px-3 py-2.5 text-[13px] bg-canvas focus:outline-none focus:border-ink rounded-lg"
              >
                <option value="">Select a country</option>
                {COUNTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
              </select>
            </label>

            {isUS ? (
              <>
                <label className="block">
                  <span className="block text-ink-soft text-[11px] tracking-[0.1em] mb-1.5">ADDRESS LINE 1</span>
                  <input
                    value={billingAddressLine1}
                    onChange={(e) => { setBillingAddressLine1(e.target.value); setSaved(false) }}
                    placeholder="Street address"
                    className="w-full border border-line px-3 py-2.5 text-[13px] bg-canvas focus:outline-none focus:border-ink rounded-lg"
                  />
                  {touched && !billingAddressLine1.trim() && <span className="text-[11px] text-madder mt-1 block">Required.</span>}
                </label>
                <label className="block">
                  <span className="block text-ink-soft text-[11px] tracking-[0.1em] mb-1.5">STATE</span>
                  <select
                    value={billingState}
                    onChange={(e) => { setBillingState(e.target.value); setSaved(false) }}
                    className="w-full border border-line px-3 py-2.5 text-[13px] bg-canvas focus:outline-none focus:border-ink rounded-lg"
                  >
                    <option value="">Select a state…</option>
                    {US_STATES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                  </select>
                  {touched && !billingState.trim() && <span className="text-[11px] text-madder mt-1 block">Required.</span>}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="block text-ink-soft text-[11px] tracking-[0.1em] mb-1.5">CITY</span>
                    <input
                      value={billingCity}
                      onChange={(e) => { setBillingCity(e.target.value); setSaved(false) }}
                      className="w-full border border-line px-3 py-2.5 text-[13px] bg-canvas focus:outline-none focus:border-ink rounded-lg"
                    />
                    {touched && !billingCity.trim() && <span className="text-[11px] text-madder mt-1 block">Required.</span>}
                  </label>
                  <label className="block">
                    <span className="block text-ink-soft text-[11px] tracking-[0.1em] mb-1.5">ZIP</span>
                    <input
                      value={billingZip}
                      onChange={(e) => { setBillingZip(e.target.value); setSaved(false) }}
                      className="w-full border border-line px-3 py-2.5 text-[13px] bg-canvas focus:outline-none focus:border-ink rounded-lg"
                    />
                    {touched && !isValidPostalCode('US', billingZip) && <span className="text-[11px] text-madder mt-1 block">Enter a valid ZIP.</span>}
                  </label>
                </div>
              </>
            ) : billingCountry ? (
              <label className="block">
                <span className="block text-ink-soft text-[11px] tracking-[0.1em] mb-1.5">POSTAL CODE</span>
                <input
                  value={billingZip}
                  onChange={(e) => { setBillingZip(e.target.value); setSaved(false) }}
                  className="w-full border border-line px-3 py-2.5 text-[13px] bg-canvas focus:outline-none focus:border-ink rounded-lg"
                />
                {touched && !zipValid && <span className="text-[11px] text-madder mt-1 block">Enter a valid postal code.</span>}
              </label>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={save}
            disabled={saving}
            className="px-6 py-2.5 bg-ink text-canvas text-[11px] tracking-[0.1em] rounded-lg hover:opacity-85 transition-opacity disabled:opacity-50"
          >
            {saving ? 'SAVING…' : 'SAVE CHANGES'}
          </button>
          {saved && <span className="text-[12px] text-ink-soft">Saved.</span>}
          {touched && billingCountry && !addressValid && !saving && <span className="text-[12px] text-madder">Please fix the highlighted fields.</span>}
        </div>
      </div>

      <div className="max-w-sm space-y-5 text-[13px]">
        <p className="text-[11px] tracking-[0.15em] text-ink-soft">CHANGE PASSWORD</p>
        <label className="block">
          <span className="block text-ink-soft text-[11px] tracking-[0.1em] mb-1.5">CURRENT PASSWORD</span>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full border border-line px-3 py-2.5 text-[13px] bg-canvas focus:outline-none focus:border-ink rounded-lg"
          />
        </label>
        <label className="block">
          <span className="block text-ink-soft text-[11px] tracking-[0.1em] mb-1.5">NEW PASSWORD</span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-line px-3 py-2.5 text-[13px] bg-canvas focus:outline-none focus:border-ink rounded-lg"
          />
        </label>
        <label className="block">
          <span className="block text-ink-soft text-[11px] tracking-[0.1em] mb-1.5">CONFIRM NEW PASSWORD</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-line px-3 py-2.5 text-[13px] bg-canvas focus:outline-none focus:border-ink rounded-lg"
          />
        </label>
        <button
          onClick={changePassword}
          disabled={pwSaving}
          className="px-6 py-2.5 text-canvas text-[11px] tracking-[0.1em] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ background: 'var(--color-sale-green)' }}
        >
          {pwSaving ? 'UPDATING…' : 'UPDATE PASSWORD'}
        </button>
        {pwMessage && <p className="text-[12px] text-ink-soft">{pwMessage}</p>}
        <p className="text-[11px] text-ink-soft">Note: if you signed up with Google, you don't have a password to change here — sign-in stays via Google.</p>
      </div>
    </div>
  )
}
