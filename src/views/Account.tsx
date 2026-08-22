'use client'

import { useEffect, useState } from 'react'
import { NavLink } from '@/components/NavLink'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { deriveVariantUrl } from '../lib/imageVariants'
import { useAuth } from '../context/AuthContext'
import { US_STATES } from '../lib/usStates'
import { isValidPostalCode } from '../lib/billingAddress'
import { EmptyState } from '../components/EmptyState'
import { ProductGridSkeleton, ListRowSkeleton } from '../components/Skeleton'
import { useToast } from '../context/ToastContext'
import { triggerPdfDownload } from '../lib/downloads'
import type { Purchase } from '../lib/types'

export type OrderRow = {
  id: string
  lemon_order_id: string
  amount: number
  currency: string
  status: string
  product_ids: string[]
  created_at: string
}

const TABS = [
  { to: '/account', label: 'Dashboard', end: true },
  { to: '/account/orders', label: 'My Orders' },
  { to: '/account/downloads', label: 'Downloads' },
  { to: '/wishlist', label: 'Wishlist' },
  { to: '/account/profile', label: 'Account Settings' },
]

export function Account() {
  const { user, profile, signOut, loading } = useAuth()

  if (loading) return null
  if (!user) {
    return (
      <div className="max-w-[1400px] mx-auto px-8 py-32 text-center">
        <p className="font-subheading text-2xl mb-4">Sign in to view your account.</p>
        <Link href="/" className="text-[12px] tracking-[0.12em] border-b border-ink pb-1">BACK TO HOME →</Link>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto px-8 md:px-16 py-14">
      <div className="border-b border-line pb-8 mb-10">
        <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-3">MY ACCOUNT</p>
        <h1 className="font-display font-semibold text-[28px] sm:text-3xl md:text-4xl leading-tight break-words">{profile?.first_name ? `Welcome back, ${profile.first_name} 👋` : 'My Account'}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[190px_minmax(0,1fr)] gap-14">
        <nav className="flex md:flex-col gap-6 md:gap-1 text-[12px] tracking-[0.08em] overflow-x-auto md:overflow-visible -mx-8 px-8 md:mx-0 md:px-0 pb-1 md:pb-0" style={{ scrollbarWidth: 'none' }}>
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              href={t.to}
              end={t.end}
              className={({ isActive }) => `shrink-0 whitespace-nowrap md:py-3 border-b md:border-b-0 md:border-l pl-0 md:pl-4 ${isActive ? 'text-ink md:border-ink' : 'text-ink-soft md:border-transparent hover:text-ink'}`}
            >
              {t.label.toUpperCase()}
            </NavLink>
          ))}
          <button onClick={signOut} className="shrink-0 whitespace-nowrap md:py-3 md:pl-4 text-left text-ink-soft hover:text-madder">LOGOUT</button>
        </nav>

        <div>
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

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white border border-line rounded-2xl px-5 py-4">
      <p className="text-[24px] font-semibold font-subheading">{value}</p>
      <p className="text-[12px] text-ink-soft mt-0.5">{label}</p>
    </div>
  )
}

function Dashboard() {
  const { user, profile } = useAuth()
  const [totalOrders, setTotalOrders] = useState<number | null>(null)
  const [completedOrders, setCompletedOrders] = useState<number | null>(null)
  const [downloads, setDownloads] = useState<number | null>(null)
  const [wishlistCount, setWishlistCount] = useState<number | null>(null)
  const [recent, setRecent] = useState<OrderRow[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', user.id).then(({ count }) => setTotalOrders(count ?? 0))
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'paid').then(({ count }) => setCompletedOrders(count ?? 0))
    supabase.from('purchases').select('id', { count: 'exact', head: true }).eq('user_id', user.id).then(({ count }) => setDownloads(count ?? 0))
    supabase.from('wishlist').select('product_id', { count: 'exact', head: true }).eq('user_id', user.id).then(({ count }) => setWishlistCount(count ?? 0))
    supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3)
      .then(({ data }) => setRecent((data as OrderRow[]) ?? []))
  }, [user])

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Orders" value={totalOrders ?? '—'} />
        <StatCard label="Completed Orders" value={completedOrders ?? '—'} />
        <StatCard label="Available Downloads" value={downloads ?? '—'} />
        <StatCard label="Wishlist Items" value={wishlistCount ?? '—'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-10">
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] tracking-[0.15em] text-ink-soft">RECENT ORDERS</p>
            <Link href="/account/orders" className="text-[11px] text-ink-soft hover:text-ink underline underline-offset-2">View all orders</Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-[13px] text-ink-soft">No orders yet.</p>
          ) : (
            <div className="bg-white border border-line rounded-2xl divide-y divide-line overflow-hidden">
              {recent.map((o) => (
                <div key={o.id} className="flex items-center justify-between px-5 py-3.5 text-[13px]">
                  <div>
                    <p className="font-medium">Order #{o.lemon_order_id}</p>
                    <p className="text-[11px] text-ink-soft mt-0.5">{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="text-[12px] font-medium">${o.amount.toFixed(2)}</span>
                  <StatusBadge status={o.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-white border border-line rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-[15px] font-semibold shrink-0" style={{ background: 'var(--color-surface)', color: 'var(--color-sale-green)' }}>
                {(profile?.first_name?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-medium truncate">{[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Your Account'}</p>
                <p className="text-[12px] text-ink-soft truncate">{user?.email}</p>
              </div>
            </div>
            {user?.created_at && (
              <p className="text-[11px] text-ink-soft mt-3">Member since {new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
            )}
            <Link href="/account/profile" className="inline-block mt-3 text-[11px] tracking-[0.08em] border border-line rounded-lg px-4 py-2 hover:bg-surface transition-colors">
              EDIT PROFILE
            </Link>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] tracking-[0.15em] text-ink-soft">BILLING ADDRESS</p>
              <Link href="/account/profile#billing" className="text-[11px] text-ink-soft hover:text-ink underline underline-offset-2">
                {profile?.billing_country ? 'Edit' : 'Add'}
              </Link>
            </div>
            {profile?.billing_country ? (
              <div className="bg-white border border-line rounded-2xl p-4 text-[13px] leading-relaxed">
                {profile.billing_country === 'US' ? (
                  <>
                    {profile.billing_address_line1 && <p>{profile.billing_address_line1}</p>}
                    <p>
                      {[profile.billing_city, profile.billing_state, profile.billing_zip].filter(Boolean).join(', ')}
                    </p>
                  </>
                ) : (
                  profile.billing_zip && <p>{profile.billing_zip}</p>
                )}
                <p className="text-ink-soft mt-0.5">{COUNTRIES.find(([code]) => code === profile.billing_country)?.[1] ?? profile.billing_country}</p>
              </div>
            ) : (
              <p className="text-[13px] text-ink-soft">No billing address on file yet.</p>
            )}
          </div>

          <div>
            <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-4">QUICK LINKS</p>
            <div className="space-y-1 text-[13px]">
              <Link href="/shop/new" className="block py-2.5 border-b border-line hover:text-ink text-ink-soft">Browse New Arrivals</Link>
              <Link href="/shop/bestsellers" className="block py-2.5 border-b border-line hover:text-ink text-ink-soft">Shop Featured Items</Link>
              <Link href="/account/downloads" className="block py-2.5 border-b border-line hover:text-ink text-ink-soft">My Downloads</Link>
              <Link href="/account/profile" className="block py-2.5 hover:text-ink text-ink-soft">Account Settings</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const style =
    status === 'paid' ? { background: '#E8F0E5', color: 'var(--color-sale-green)' } :
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
