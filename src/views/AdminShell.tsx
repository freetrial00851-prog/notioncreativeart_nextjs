'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { NavLink } from '@/components/NavLink'
import { MaterialIcon } from '../components/MaterialIcon'
import { AdminUiProvider } from '../components/adminUi'

type NavItem = { to: string; label: string; icon: string; end?: boolean; badge?: 'reviews'; hint?: string }
type NavGroup = { title: string; items: NavItem[] }

export const ADMIN_GROUPS: NavGroup[] = [
  {
    title: '',
    items: [{ to: '/admin', label: 'Today', icon: 'dashboard', end: true, hint: 'what needs you right now' }],
  },
  {
    title: 'Sales',
    items: [
      { to: '/admin/orders', label: 'Orders', icon: 'receipt_long', hint: 'refunds, receipts' },
      { to: '/admin/customers', label: 'Customers', icon: 'group', hint: 'everyone and what they did' },
      { to: '/admin/saved', label: 'Wishlists & carts', icon: 'favorite', hint: 'who saved or abandoned' },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { to: '/admin/listings', label: 'Listings', icon: 'sell', hint: 'add, edit patterns' },
      { to: '/admin/bulk-upload', label: 'Bulk upload', icon: 'upload_file', hint: 'many patterns at once' },
      { to: '/admin/categories', label: 'Categories', icon: 'category' },
      { to: '/admin/reviews', label: 'Reviews', icon: 'rate_review', badge: 'reviews', hint: 'approve customer reviews' },
      { to: '/admin/trash', label: 'Trash', icon: 'delete', hint: 'restore deleted items' },
    ],
  },
  {
    title: 'Insights',
    items: [
      { to: '/admin/analytics', label: 'Analytics', icon: 'insights', hint: 'revenue, visitors, funnel' },
      { to: '/admin/products', label: 'Product insights', icon: 'track_changes', hint: 'what sells, what doesn’t' },
      { to: '/admin/traffic', label: 'Traffic & search', icon: 'travel_explore', hint: 'where visitors come from' },
    ],
  },
  {
    title: 'Storefront',
    items: [
      { to: '/admin/homepage', label: 'Homepage', icon: 'language', hint: 'banner, story, free collage' },
      { to: '/admin/subscribers', label: 'Newsletter', icon: 'mail', hint: 'subscribers' },
    ],
  },
  {
    title: 'System',
    items: [{ to: '/admin/setup', label: 'Tracking setup', icon: 'tune', hint: 'turn analytics on' }],
  },
]

const ALL_ITEMS = ADMIN_GROUPS.flatMap((g) => g.items)
const TAB_BAR = ['/admin', '/admin/orders', '/admin/listings', '/admin/customers']

export function pageTitle(pathname: string | null): string {
  const p = (pathname ?? '/admin').replace(/\/$/, '') || '/admin'
  if (p === '/admin/classic') return 'Classic dashboard'
  return ALL_ITEMS.find((i) => i.to === p)?.label ?? 'Shop Manager'
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-ink text-[13px] font-bold text-white">N</span>
      <span className="leading-tight">
        <span className="block font-heading text-[16px] font-bold text-ink">Shop Manager</span>
        <span className="block text-[11px] text-[#8a8f98]">Notion Creative Art</span>
      </span>
    </Link>
  )
}

function SideNav({ pending, onNavigate }: { pending: number; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Admin">
      {ADMIN_GROUPS.map((g, gi) => (
        <div key={gi} className={gi === 0 ? '' : 'mt-5'}>
          {g.title && <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0a8]">{g.title}</p>}
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const badge = item.badge === 'reviews' && pending > 0 ? pending : null
              return (
                <li key={item.to}>
                  <NavLink
                    href={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `group flex min-h-10 items-center gap-3 rounded-[10px] px-3 text-[13.5px] transition-colors ${
                        isActive ? 'bg-ink font-medium text-white' : 'text-[#3f4650] hover:bg-[#F1F2F4]'
                      }`
                    }
                  >
                    <MaterialIcon name={item.icon} size={18} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {badge != null && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-sale px-1.5 text-[11px] font-semibold text-white">{badge}</span>
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

/** Ctrl/⌘+K — jump to any page or action. */
function Palette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const pages = ALL_ITEMS.filter((i) => !needle || `${i.label} ${i.hint ?? ''}`.toLowerCase().includes(needle)).map((i) => ({
      key: i.to,
      label: i.label,
      sub: i.hint ?? '',
      icon: i.icon,
      go: () => router.push(i.to),
    }))
    if (needle.length >= 2) {
      pages.push({
        key: 'cust',
        label: `Find customer “${q.trim()}”`,
        sub: 'search by name or email',
        icon: 'search',
        go: () => router.push(`/admin/customers?q=${encodeURIComponent(q.trim())}`),
      })
    }
    return pages
  }, [q, router])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
  }, [open])

  if (!open) return null
  const run = (i: number) => {
    results[i]?.go()
    onClose()
    setQ('')
  }
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search the admin">
      <div className="absolute inset-0 bg-black/35" onClick={onClose} />
      <div className="relative w-full max-w-[520px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-[#EEF0F2] px-4">
          <MaterialIcon name="search" size={18} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setActive(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((a) => Math.min(a + 1, results.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => Math.max(a - 1, 0))
              } else if (e.key === 'Enter') run(active)
              else if (e.key === 'Escape') onClose()
            }}
            placeholder="Jump to a page, or type a customer name / email"
            aria-label="Search"
            className="h-14 flex-1 bg-transparent text-[15px] outline-none"
          />
          <kbd className="rounded-md border border-[#E5E7EB] px-1.5 py-0.5 text-[11px] text-[#8a8f98]">esc</kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
          {results.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-[#8a8f98]">Nothing found.</li>}
          {results.map((r, i) => (
            <li key={r.key} role="option" aria-selected={i === active}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => run(i)}
                className={`flex min-h-12 w-full items-center gap-3 rounded-[10px] px-3 text-left ${i === active ? 'bg-[#F1F2F4]' : ''}`}
              >
                <MaterialIcon name={r.icon} size={18} />
                <span className="flex-1">
                  <span className="block text-[14px] text-ink">{r.label}</span>
                  {r.sub && <span className="block text-[12px] text-[#8a8f98]">{r.sub}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function AdminShell({
  children,
  pendingReviews,
  email,
  name,
  onSignOut,
}: {
  children: ReactNode
  pendingReviews: number
  email?: string | null
  name: string
  onSignOut: () => void
}) {
  const pathname = usePathname()
  const [drawer, setDrawer] = useState(false)
  const [palette, setPalette] = useState(false)
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette((o) => !o)
      }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])

  const title = pageTitle(pathname)
  const tabs = TAB_BAR.map((to) => ALL_ITEMS.find((i) => i.to === to)!).filter(Boolean)

  return (
    <div className="admin-theme min-h-screen bg-[#F6F6F7] text-ink md:flex">
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-[#E5E7EB] bg-white md:flex">
        <div className="px-5 py-5">
          <Brand />
        </div>
        <SideNav pending={pendingReviews} />
        <div className="border-t border-[#EEF0F2] p-3">
          <a href="/" target="_blank" rel="noreferrer" className="flex min-h-10 items-center gap-3 rounded-[10px] px-3 text-[13.5px] text-[#3f4650] hover:bg-[#F1F2F4]">
            <MaterialIcon name="open_in_new" size={18} /> View shop
          </a>
        </div>
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/35" onClick={() => setDrawer(false)} />
          <aside className="relative flex w-[280px] max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between px-5 py-4">
              <Brand />
              <button onClick={() => setDrawer(false)} aria-label="Close menu" className="grid h-10 w-10 place-items-center rounded-full hover:bg-[#F1F2F4]">
                <MaterialIcon name="close" size={20} />
              </button>
            </div>
            <SideNav pending={pendingReviews} onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-[#E5E7EB] bg-white/90 px-4 backdrop-blur md:px-8">
          <button onClick={() => setDrawer(true)} aria-label="Open menu" className="grid h-10 w-10 place-items-center rounded-full hover:bg-[#F1F2F4] md:hidden">
            <MaterialIcon name="menu" size={22} />
          </button>
          <h1 className="font-heading text-[17px] font-bold md:text-[18px]">{title}</h1>
          <div className="flex-1" />
          <button
            onClick={() => setPalette(true)}
            className="hidden min-h-10 w-[280px] items-center gap-2 rounded-full border border-[#E5E7EB] bg-[#F6F6F7] px-4 text-left text-[13px] text-[#8a8f98] hover:border-[#c9cdd2] sm:flex"
          >
            <MaterialIcon name="search" size={16} />
            <span className="flex-1">Search or jump to…</span>
            <kbd className="rounded border border-[#E5E7EB] bg-white px-1.5 text-[11px]">Ctrl K</kbd>
          </button>
          <button onClick={() => setPalette(true)} aria-label="Search" className="grid h-10 w-10 place-items-center rounded-full hover:bg-[#F1F2F4] sm:hidden">
            <MaterialIcon name="search" size={20} />
          </button>
          <div className="relative">
            <button onClick={() => setMenu((m) => !m)} aria-label="Account menu" aria-expanded={menu} className="grid h-9 w-9 place-items-center rounded-full bg-ink text-[13px] font-semibold text-white">
              {(name[0] || 'A').toUpperCase()}
            </button>
            {menu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
                <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-[#E5E7EB] bg-white p-2 shadow-xl">
                  <p className="truncate px-3 pt-2 text-[13px] font-medium">{name}</p>
                  <p className="truncate px-3 pb-2 text-[12px] text-[#8a8f98]">{email}</p>
                  <a href="/" target="_blank" rel="noreferrer" className="flex min-h-10 items-center rounded-[10px] px-3 text-[13px] hover:bg-[#F1F2F4]">View shop ↗</a>
                  <button onClick={onSignOut} className="flex min-h-10 w-full items-center rounded-[10px] px-3 text-left text-[13px] hover:bg-[#F1F2F4]">Sign out</button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-5 pb-24 md:px-8 md:py-7 md:pb-10">
          <div className="mx-auto w-full max-w-[1200px]"><AdminUiProvider>{children}</AdminUiProvider></div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#E5E7EB] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Quick navigation">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            href={t.to}
            end={t.end}
            className={({ isActive }) => `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] ${isActive ? 'font-semibold text-ink' : 'text-[#8a8f98]'}`}
          >
            <MaterialIcon name={t.icon} size={20} />
            {t.label}
          </NavLink>
        ))}
        <button onClick={() => setDrawer(true)} className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-[#8a8f98]">
          <MaterialIcon name="menu" size={20} />
          More
        </button>
      </nav>

      <Palette open={palette} onClose={() => setPalette(false)} />
    </div>
  )
}
