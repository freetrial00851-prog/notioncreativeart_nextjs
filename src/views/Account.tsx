'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { deriveVariantUrl } from '../lib/imageVariants'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { US_STATES } from '../lib/usStates'
import { isValidPostalCode } from '../lib/billingAddress'
import { EmptyState } from '../components/EmptyState'
import { ListRowSkeleton, ContentSkeleton, DownloadsTableSkeleton } from '../components/Skeleton'
import { useToast } from '../context/ToastContext'
import { triggerPdfDownload } from '../lib/downloads'
import { MaterialIcon } from '../components/MaterialIcon'
import { StatusBadge, type OrderRow } from '../components/StatusBadge'
import { Wishlist } from './Wishlist'
import { OrderDetail } from './OrderDetail'
import { subscribeToNewsletter } from '../lib/newsletter'
import { profileDisplayName, profileInitial } from '../lib/profileName'
import type { Purchase, Product } from '../lib/types'

export type { OrderRow } from '../components/StatusBadge'
export { StatusBadge } from '../components/StatusBadge'

const BRAND = '#1f249c'
const BRAND_SOFT = '#e9eaf5'

const PAGE_TITLES: Record<string, string> = {
  '/account/orders': 'Orders',
  '/account/downloads': 'Downloads',
  '/account/wishlist': 'Wishlist',
  '/account/addresses': 'Addresses',
  '/account/profile': 'Account Settings',
  '/account/newsletter': 'Newsletter',
  '/account/logout': 'Log Out',
}

export function Account() {
  const { user, loading } = useAuth()
  const { openAuthModal } = useUI()
  const pathname = usePathname()

  if (loading) return <ContentSkeleton />

  // Guests can browse a local wishlist; other account tabs still require sign-in.
  if (!user && pathname === '/account/wishlist') {
    return <Wishlist />
  }

  if (!user) {
    return (
      <div className="max-w-site w-full mx-auto px-8 py-32 text-center">
        <p className="font-subheading text-2xl mb-4">Sign in to view your account.</p>
        <button type="button" onClick={() => openAuthModal()} className="text-[12px] tracking-[0.12em] border-b border-ink pb-1 hover:opacity-70">
          SIGN IN →
        </button>
      </div>
    )
  }

  const isOrderDetail = /^\/account\/orders\/[^/]+$/.test(pathname ?? '')
  const crumbLabel = isOrderDetail
    ? 'Order Details'
    : (PAGE_TITLES[pathname ?? ''] ?? 'Account')
  const isAccountHome = pathname === '/account' || pathname === '/account/'
  const showPageTitle = !isOrderDetail && pathname !== '/account/wishlist' && !isAccountHome && pathname !== '/account/logout'

  return (
    <div className="max-w-[1100px] mx-auto px-5 sm:px-8 md:px-12 lg:px-16 py-8 md:py-10 pb-16">
      <nav className="flex items-center gap-2 text-[12px] text-ink-soft mb-6 flex-wrap" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link>
        {!isAccountHome && (
          <>
            <span>›</span>
            {isOrderDetail ? (
              <>
                <Link href="/account/orders" className="hover:text-ink">Orders</Link>
                <span>›</span>
                <span className="text-ink">Details</span>
              </>
            ) : (
              <span className="text-ink">{crumbLabel}</span>
            )}
          </>
        )}
      </nav>

      {showPageTitle && (
        <h1 className="font-display font-semibold text-3xl md:text-4xl text-ink mb-6">{crumbLabel}</h1>
      )}
      <AccountContent />
    </div>
  )
}

/** Renders account tab content based on the current URL pathname. */
function AccountContent() {
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
      return <Downloads />
    case '/account/wishlist':
      return <Wishlist embedded />
    case '/account/addresses':
      return <AddressesPage />
    case '/account/newsletter':
      return <NewsletterPrefs />
    case '/account/logout':
      return <LogoutConfirm />
    case '/account/profile':
      return <ProfileTab />
    default:
      return <MyOrders />
  }
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
  const filters: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'All Orders' },
    { key: 'paid', label: 'Completed' },
    { key: 'pending', label: 'Processing' },
    { key: 'refunded', label: 'Refunded' },
  ]

  if (loading) return <ListRowSkeleton />

  return (
    <div>
      <div className="flex gap-1 sm:gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="shrink-0 px-4 py-2 rounded-full text-[12px] font-medium transition-colors"
            style={filter === f.key
              ? { background: BRAND, color: '#fff' }
              : { background: 'var(--color-surface)', color: 'var(--color-ink-soft)' }}
          >
            {f.label}
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
        <div className="bg-white border border-line rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] min-w-[560px]">
              <thead>
                <tr className="text-left text-[11px] tracking-[0.06em] text-ink-soft border-b border-line bg-surface/50">
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Items</th>
                  <th className="px-3 py-3 font-medium">Total</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-surface/40">
                    <td className="px-5 py-4 font-medium">#{o.lemon_order_id || o.id.slice(0, 8)}</td>
                    <td className="px-3 py-4 text-ink-soft">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="px-3 py-4 text-ink-soft">{o.product_ids?.length ?? 0}</td>
                    <td className="px-3 py-4 font-medium">${o.amount.toFixed(2)}</td>
                    <td className="px-3 py-4"><StatusBadge status={o.status} /></td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/account/orders/${o.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold tracking-[0.06em] rounded-lg border border-line hover:bg-surface"
                      >
                        VIEW
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

  if (loading) return <DownloadsTableSkeleton rows={4} />
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
    <div className="bg-white border border-line rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] min-w-[520px]">
          <thead>
            <tr className="text-left text-[11px] tracking-[0.06em] text-ink-soft border-b border-line bg-surface/50">
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-3 py-3 font-medium">Purchased</th>
              <th className="px-3 py-3 font-medium">File</th>
              <th className="px-5 py-3 font-medium text-right">Download</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {purchases.map((p) => (
              <tr key={p.id} className="hover:bg-surface/40">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <Link href={p.product ? `/pattern/${p.product.slug}` : '#'} className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-surface">
                      {p.product?.images?.[0] ? (
                        <img src={deriveVariantUrl(p.product.images[0], 'micro')} alt={p.product.title} loading="lazy" className="w-full h-full object-cover" />
                      ) : null}
                    </Link>
                    <Link href={p.product ? `/pattern/${p.product.slug}` : '#'} className="font-medium truncate hover:underline underline-offset-2 max-w-[220px]">
                      {p.product?.title ?? 'Pattern'}
                    </Link>
                  </div>
                </td>
                <td className="px-3 py-3.5 text-ink-soft whitespace-nowrap">{new Date(p.purchase_date).toLocaleDateString()}</td>
                <td className="px-3 py-3.5 text-ink-soft">PDF Pattern</td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={() => download(p.product_id, p.product?.title)}
                    disabled={downloading === p.product_id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-canvas text-[11px] font-semibold tracking-[0.06em] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ background: BRAND }}
                  >
                    <MaterialIcon name="download" size={14} />
                    {downloading === p.product_id ? '…' : 'DOWNLOAD'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

type SettingsTab = 'profile' | 'password' | 'addresses'

function settingsTabFromSearch(tab: string | null): SettingsTab {
  if (tab === 'password' || tab === 'addresses') return tab
  return 'profile'
}

function ProfileTab() {
  const { user, profile, refreshProfile } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const settingsTab = settingsTabFromSearch(searchParams.get('tab'))

  const selectSettingsTab = (key: SettingsTab) => {
    const href = key === 'profile' ? '/account/profile' : `/account/profile?tab=${key}`
    router.replace(href, { scroll: false })
  }
  const [name, setName] = useState(profile?.name ?? '')
  const [editingName, setEditingName] = useState(false)
  const [nameSaving, setNameSaving] = useState(false)

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMessage, setPwMessage] = useState<string | null>(null)

  useEffect(() => {
    setName(profile?.name ?? '')
  }, [profile?.name])

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
    setName(profile?.name ?? '')
    setEditingName(false)
  }

  const saveName = async () => {
    if (!user) return
    setNameSaving(true)
    const { error } = await supabase.from('profiles').update({
      name: name.trim() || null,
      name_changed_at: new Date().toISOString(),
    }).eq('id', user.id)
    await refreshProfile()
    setNameSaving(false)
    if (error) { showToast("Couldn't update your name — please try again.", 'error'); return }
    setEditingName(false)
    showToast('Name updated.', 'success')
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
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPwMessage(null)
    showToast('Password updated.', 'success')
  }

  return (
    <div>
      <div className="flex gap-6 border-b border-line mb-8 text-[13px] tracking-[0.08em] overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {([
          { key: 'profile' as const, label: 'Profile Information' },
          { key: 'password' as const, label: 'Password' },
          { key: 'addresses' as const, label: 'Addresses' },
        ]).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => selectSettingsTab(t.key)}
            aria-current={settingsTab === t.key ? 'page' : undefined}
            className={`pb-3 border-b-2 -mb-px shrink-0 ${settingsTab === t.key ? 'border-[var(--color-accent)] text-[var(--color-accent)] font-medium' : 'border-transparent text-ink-soft hover:text-ink'}`}
          >
            {t.label.toUpperCase()}
          </button>
        ))}
      </div>

      {settingsTab === 'profile' && (
        <div className="bg-white border border-line rounded-2xl p-5 sm:p-6 max-w-xl space-y-5 text-[13px] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-[20px] font-semibold shrink-0" style={{ background: BRAND_SOFT, color: BRAND }}>
              {profileInitial(profile, user?.email)}
            </div>
            <div>
              <p className="font-medium text-[15px]">{profileDisplayName(profile, 'Your Account')}</p>
              <p className="text-[13px] text-ink-soft">{user?.email}</p>
            </div>
          </div>
          <label className="block">
            <div className="flex items-center justify-between mb-1.5">
              <span className="block text-ink-soft text-[13px]">NAME</span>
              {!editingName && (
                <button onClick={startEditingName} className="text-[11px] tracking-[0.08em] underline underline-offset-2 hover:opacity-70" style={{ color: BRAND }}>
                  EDIT YOUR NAME
                </button>
              )}
            </div>
            <input
              value={name}
              disabled={!editingName}
              onChange={(e) => setName(e.target.value)}
              placeholder="Optional"
              className="w-full border border-line px-3 py-2.5 text-[13px] bg-canvas focus:outline-none focus:border-ink rounded-lg disabled:bg-surface disabled:text-ink-soft"
            />
          </label>
          {editingName && (
            <div className="flex items-center gap-3">
              <button
                onClick={saveName}
                disabled={nameSaving}
                className="px-5 py-2 text-canvas text-[13px] font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: BRAND }}
              >
                {nameSaving ? 'Saving…' : 'Save name'}
              </button>
              <button onClick={cancelEditingName} className="text-[13px] text-ink-soft hover:text-ink">Cancel</button>
            </div>
          )}
          {!editingName && nameEditLocked && (
            <p className="text-[11px] text-ink-soft">You can change your name again in {nameCooldownDaysLeft} day{nameCooldownDaysLeft === 1 ? '' : 's'}.</p>
          )}
          <div>
            <p className="text-ink-soft text-[13px] mb-1">EMAIL</p>
            <p>{user?.email}</p>
            <p className="text-ink-soft text-[11px] mt-1">Contact support to change your email address.</p>
          </div>
        </div>
      )}

      {settingsTab === 'password' && (
        <div className="bg-white border border-line rounded-2xl p-5 sm:p-6 max-w-sm space-y-5 text-[13px] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <label className="block">
            <span className="block text-ink-soft text-[13px] mb-1.5">CURRENT PASSWORD</span>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full border border-line px-3 py-2.5 text-[13px] bg-canvas focus:outline-none focus:border-ink rounded-lg"
            />
          </label>
          <label className="block">
            <span className="block text-ink-soft text-[13px] mb-1.5">NEW PASSWORD</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-line px-3 py-2.5 text-[13px] bg-canvas focus:outline-none focus:border-ink rounded-lg"
            />
          </label>
          <label className="block">
            <span className="block text-ink-soft text-[13px] mb-1.5">CONFIRM NEW PASSWORD</span>
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
            className="px-6 py-2.5 text-canvas text-[13px] font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ background: BRAND }}
          >
            {pwSaving ? 'Updating…' : 'Update password'}
          </button>
          {pwMessage && <p className="text-[13px] text-ink-soft">{pwMessage}</p>}
          <p className="text-[11px] text-ink-soft">If you signed up with Google, password changes aren&apos;t available here.</p>
        </div>
      )}

      {settingsTab === 'addresses' && <AddressesPage />}
    </div>
  )
}

function AddressesPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [billingCountry, setBillingCountry] = useState(profile?.billing_country ?? '')
  const [billingAddressLine1, setBillingAddressLine1] = useState(profile?.billing_address_line1 ?? '')
  const [billingCity, setBillingCity] = useState(profile?.billing_city ?? '')
  const [billingState, setBillingState] = useState(profile?.billing_state ?? '')
  const [billingZip, setBillingZip] = useState(profile?.billing_zip ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [touched, setTouched] = useState(false)
  const [editing, setEditing] = useState(!profile?.billing_country)

  useEffect(() => {
    setBillingCountry(profile?.billing_country ?? '')
    setBillingAddressLine1(profile?.billing_address_line1 ?? '')
    setBillingCity(profile?.billing_city ?? '')
    setBillingState(profile?.billing_state ?? '')
    setBillingZip(profile?.billing_zip ?? '')
    setEditing(!profile?.billing_country)
  }, [profile?.billing_country, profile?.billing_address_line1, profile?.billing_city, profile?.billing_state, profile?.billing_zip])

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
  }

  const hasAddress = !!profile?.billing_country

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex gap-2 mb-2">
        <span className="px-4 py-2 rounded-full text-[12px] font-medium text-canvas" style={{ background: BRAND }}>Billing Address</span>
      </div>

      {hasAddress && !editing ? (
        <div className="bg-white border border-line rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between gap-3 mb-3">
            <p className="text-[14px] font-semibold">{profileDisplayName(profile, 'Billing')}</p>
            <span className="text-[10px] tracking-wide px-2.5 py-1 rounded-full font-medium" style={{ background: BRAND_SOFT, color: BRAND }}>Default</span>
          </div>
          <div className="text-[13px] text-ink-soft leading-relaxed space-y-0.5">
            {profile?.billing_country === 'US' ? (
              <>
                {profile.billing_address_line1 && <p>{profile.billing_address_line1}</p>}
                <p>{[profile.billing_city, profile.billing_state, profile.billing_zip].filter(Boolean).join(', ')}</p>
              </>
            ) : (
              profile?.billing_zip && <p>{profile.billing_zip}</p>
            )}
            <p>{COUNTRIES.find(([code]) => code === profile?.billing_country)?.[1] ?? profile?.billing_country}</p>
          </div>
          <div className="flex gap-3 mt-4 pt-4 border-t border-line">
            <button onClick={() => setEditing(true)} className="text-[12px] font-medium underline underline-offset-2" style={{ color: BRAND }}>Edit</button>
          </div>
        </div>
      ) : null}

      {(editing || !hasAddress) && (
        <div className="bg-white border border-line rounded-2xl p-5 sm:p-6 space-y-4 text-[13px] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-[13px] text-ink-soft">Saved here fills in automatically at checkout.</p>
          <label className="block">
            <span className="block text-ink-soft text-[13px] mb-1.5">COUNTRY</span>
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
                <span className="block text-ink-soft text-[13px] mb-1.5">ADDRESS LINE 1</span>
                <input value={billingAddressLine1} onChange={(e) => { setBillingAddressLine1(e.target.value); setSaved(false) }} className="w-full border border-line px-3 py-2.5 text-[13px] bg-canvas focus:outline-none focus:border-ink rounded-lg" />
              </label>
              <label className="block">
                <span className="block text-ink-soft text-[13px] mb-1.5">STATE</span>
                <select value={billingState} onChange={(e) => { setBillingState(e.target.value); setSaved(false) }} className="w-full border border-line px-3 py-2.5 text-[13px] bg-canvas focus:outline-none focus:border-ink rounded-lg">
                  <option value="">Select a state…</option>
                  {US_STATES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-ink-soft text-[13px] mb-1.5">CITY</span>
                  <input value={billingCity} onChange={(e) => { setBillingCity(e.target.value); setSaved(false) }} className="w-full border border-line px-3 py-2.5 text-[13px] bg-canvas focus:outline-none focus:border-ink rounded-lg" />
                </label>
                <label className="block">
                  <span className="block text-ink-soft text-[13px] mb-1.5">ZIP</span>
                  <input value={billingZip} onChange={(e) => { setBillingZip(e.target.value); setSaved(false) }} className="w-full border border-line px-3 py-2.5 text-[13px] bg-canvas focus:outline-none focus:border-ink rounded-lg" />
                </label>
              </div>
            </>
          ) : billingCountry ? (
            <label className="block">
              <span className="block text-ink-soft text-[13px] mb-1.5">POSTAL CODE</span>
              <input value={billingZip} onChange={(e) => { setBillingZip(e.target.value); setSaved(false) }} className="w-full border border-line px-3 py-2.5 text-[13px] bg-canvas focus:outline-none focus:border-ink rounded-lg" />
              {touched && !zipValid && <span className="text-[11px] text-madder mt-1 block">Enter a valid postal code.</span>}
            </label>
          ) : null}
          <div className="flex items-center gap-3 pt-2">
            <button onClick={save} disabled={saving} className="px-6 py-2.5 text-canvas text-[13px] font-semibold rounded-lg hover:opacity-90 disabled:opacity-50" style={{ background: BRAND }}>
              {saving ? 'Saving…' : 'Save address'}
            </button>
            {hasAddress && <button onClick={() => setEditing(false)} className="text-[13px] text-ink-soft hover:text-ink">Cancel</button>}
            {saved && <span className="text-[13px] text-ink-soft">Saved.</span>}
          </div>
        </div>
      )}
    </div>
  )
}

function NewsletterPrefs() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [subscribed, setSubscribed] = useState(false)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!user?.email) return
    if (!subscribed) {
      showToast('Uncheck and we won’t email you — leave the box checked to stay subscribed.', 'info')
      return
    }
    setSaving(true)
    const { ok, error } = await subscribeToNewsletter(user.email)
    setSaving(false)
    if (!ok) showToast(error ?? "Couldn't subscribe.", 'error')
    else showToast('You’re subscribed to the maker newsletter.', 'success')
  }

  return (
    <div className="bg-white border border-line rounded-2xl p-5 sm:p-6 max-w-lg space-y-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <p className="text-[14px] text-ink-soft leading-relaxed">
        Get new pattern drops, freebies, and maker tips at <span className="text-ink font-medium">{user?.email}</span>.
      </p>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={subscribed}
          onChange={(e) => setSubscribed(e.target.checked)}
          className="w-4 h-4 accent-[var(--color-accent)]"
        />
        <span className="text-[14px] font-medium">Subscribe to newsletter</span>
      </label>
      <button
        onClick={save}
        disabled={saving || !subscribed}
        className="px-6 py-2.5 text-canvas text-[13px] font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
        style={{ background: BRAND }}
      >
        {saving ? 'Saving…' : 'Save preferences'}
      </button>
    </div>
  )
}

function LogoutConfirm() {
  const { signOut } = useAuth()
  return (
    <div className="bg-white border border-line rounded-2xl p-8 sm:p-12 max-w-md mx-auto text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: BRAND_SOFT }}>
        <MaterialIcon name="logout" size={28} color={BRAND} />
      </div>
      <h2 className="font-display font-semibold text-2xl mb-2">Log Out</h2>
      <p className="text-[14px] text-ink-soft mb-8">Are you sure you want to sign out of your Notion Creative Art account?</p>
      <button
        onClick={signOut}
        className="w-full py-3.5 text-canvas text-[13px] font-semibold rounded-lg hover:opacity-90 mb-3"
        style={{ background: BRAND }}
      >
        Log out
      </button>
      <Link href="/account/orders" className="text-[12px] text-ink-soft hover:text-ink underline underline-offset-2">
        Cancel - stay signed in
      </Link>
    </div>
  )
}
