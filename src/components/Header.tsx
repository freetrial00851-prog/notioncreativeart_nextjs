'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'
import { searchProducts } from '../lib/productSearch'
import {
  getCategoriesWithProducts,
  getSubcategoriesWithCounts,
  type CategoryWithCount,
  type SubcategoryWithCount,
} from '../lib/categories'
import { deriveVariantUrl } from '../lib/imageVariants'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'
import { useFocusTrap } from '../lib/useFocusTrap'
import type { Product } from '../lib/types'
import { profileDisplayName, profileInitial } from '../lib/profileName'
import { MaterialIcon } from './MaterialIcon'
import { Logo } from './Logo'

const NAV_LINKS = [
  { href: '/#collections', label: 'Collections' },
  { href: '/shop?price=free', label: 'Free patterns' },
  { href: '/about', label: 'Our story' },
] as const

const POPULAR_SEARCHES = [
  { label: 'Free patterns', href: '/shop?price=free' },
  { label: 'Beginner', href: '/shop?level=beginner' },
  { label: 'Amigurumi', href: '/shop/amigurumi' },
  { label: 'New arrivals', href: '/shop?sort=newest' },
] as const

/** Small uppercase nav label — matches the reference header. */
const NAV_LABEL =
  'text-[11px] font-semibold uppercase tracking-[0.11em] text-ink transition-colors hover:text-coral'

const TILE_COLORS = ['#F2F2F2', '#EDEDED', '#F5F5F5', '#EBEBEB'] as const

export function Header() {
  const { user, profile, signOut, loading: authLoading } = useAuth()
  const { requireAuth } = useUI()
  const { count: cartCount, openDrawer } = useCart()
  const router = useRouter()
  const pathname = usePathname()

  const [menuOpen, setMenuOpen] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [subcategories, setSubcategories] = useState<Record<string, SubcategoryWithCount[]>>({})
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Product[]>([])

  const shopWrapRef = useRef<HTMLDivElement>(null)
  const accountWrapRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useBodyScrollLock(menuOpen)

  useEffect(() => {
    getCategoriesWithProducts(supabase).then(setCategories)
  }, [])

  // Debounced live suggestions while the search panel is open.
  useEffect(() => {
    if (!searchOpen) return
    const q = query.trim()
    if (!q) return
    const timer = setTimeout(() => {
      searchProducts(q, 5).then(setSuggestions)
    }, 220)
    return () => clearTimeout(timer)
  }, [query, searchOpen])

  // Close every overlay on navigation.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchOpen(false)
    setMenuOpen(false)
    setShopOpen(false)
    setAccountOpen(false)
  }, [pathname])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (shopWrapRef.current && !shopWrapRef.current.contains(t)) setShopOpen(false)
      if (accountWrapRef.current && !accountWrapRef.current.contains(t)) setAccountOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setSearchOpen(false)
      setShopOpen(false)
      setAccountOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  const openSearch = () => {
    setShopOpen(false)
    setAccountOpen(false)
    setMenuOpen(false)
    setSearchOpen(true)
  }

  const closeSearch = () => {
    setSearchOpen(false)
    setQuery('')
    setSuggestions([])
  }

  const submitSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    const q = query.trim()
    if (!q) return
    closeSearch()
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  const toggleCategory = (id: string) => {
    const opening = expandedCategory !== id
    setExpandedCategory(opening ? id : null)
    if (opening && subcategories[id] === undefined) {
      getSubcategoriesWithCounts(supabase, id).then((list) => setSubcategories((prev) => ({ ...prev, [id]: list })))
    }
  }

  const closeMenu = () => {
    setMenuOpen(false)
    setExpandedCategory(null)
  }
  // Keyboard users stay inside the open menu; Escape closes it and focus returns to the menu button.
  useFocusTrap(menuRef, menuOpen, { onEscape: closeMenu })

  const goSignIn = () => {
    closeMenu()
    requireAuth()
  }

  return (
    <>
      <header className="glass sticky top-0 z-40 border-b border-border">
        <div className="mx-auto flex h-[67px] max-w-site items-center justify-between gap-6 page-gutter lg:h-[78px]">
          <Logo variant="full" />

          {/* Primary nav (desktop) */}
          <nav className="hidden items-center gap-[29px] lg:flex" aria-label="Primary">
            <div ref={shopWrapRef} className="relative">
              <button
                type="button"
                aria-expanded={shopOpen}
                onClick={() => {
                  setSearchOpen(false)
                  setShopOpen((v) => !v)
                }}
                className={`${NAV_LABEL} inline-flex min-h-11 items-center gap-1.5`}
              >
                Shop patterns
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  aria-hidden
                  className={`transition-transform ${shopOpen ? 'rotate-180' : ''}`}
                >
                  <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {shopOpen && <ShopMegaMenu categories={categories} onClose={() => setShopOpen(false)} />}
            </div>
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={NAV_LABEL}>
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 text-ink sm:gap-2">
            <button
              type="button"
              aria-label="Search patterns"
              aria-expanded={searchOpen}
              onClick={() => (searchOpen ? closeSearch() : openSearch())}
              className="inline-flex size-11 items-center justify-center transition-colors hover:text-coral"
            >
              <MaterialIcon name="search" size={22} color="currentColor" />
            </button>

            <button
              type="button"
              aria-label="Wishlist"
              onClick={() => router.push('/account/wishlist')}
              className="hidden size-11 items-center justify-center transition-colors hover:text-coral lg:inline-flex"
            >
              <MaterialIcon name="favorite" size={21} color="currentColor" />
            </button>

            {!authLoading && !user ? (
              <button
                type="button"
                onClick={() => requireAuth()}
                className={`${NAV_LABEL} hidden min-h-11 items-center px-2 lg:inline-flex`}
              >
                Sign in
              </button>
            ) : (
              <div ref={accountWrapRef} className="relative hidden lg:block">
                <button
                  type="button"
                  aria-label="Your account"
                  aria-expanded={accountOpen}
                  onClick={() => setAccountOpen((v) => !v)}
                  className="inline-flex size-11 items-center justify-center transition-colors hover:text-coral"
                >
                  <MaterialIcon name="person" size={22} color="currentColor" />
                </button>
                {accountOpen && user && (
                  <AccountDropdown
                    profile={profile}
                    email={user.email}
                    onClose={() => setAccountOpen(false)}
                    onSignOut={() => {
                      void signOut()
                      setAccountOpen(false)
                    }}
                  />
                )}
              </div>
            )}

            <button
              type="button"
              aria-label={`Bag${cartCount > 0 ? `, ${cartCount} items` : ''}`}
              onClick={openDrawer}
              className="relative inline-flex min-h-11 items-center gap-1 px-2 text-[12px] font-semibold transition-colors hover:text-coral"
            >
              <MaterialIcon name="shopping_bag" size={22} color="currentColor" className="sm:hidden" />
              <span key={`t${cartCount}`} className={`hidden sm:inline ${cartCount > 0 ? 'animate-pop' : ''}`}>Bag ({cartCount})</span>
              {cartCount > 0 && (
                <span key={cartCount} className="animate-pop absolute right-0 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[11px] font-bold leading-none text-white sm:hidden">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => {
                setSearchOpen(false)
                setMenuOpen(true)
              }}
              className="-mr-2 inline-flex size-11 items-center justify-center lg:hidden"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search panel */}
        {searchOpen && (
          <div className="absolute inset-x-0 top-full border-b border-border bg-bg shadow-[0_24px_40px_-24px_rgba(32,32,68,0.28)]">
            <div className="mx-auto max-w-site page-gutter py-6 lg:py-9">
              <form onSubmit={submitSearch} role="search" className="flex items-center gap-4 border-b-2 border-ink pb-3">
                <MaterialIcon name="search" size={26} color="currentColor" className="shrink-0 text-ink" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    if (!e.target.value.trim()) setSuggestions([])
                  }}
                  placeholder="Search patterns"
                  aria-label="Search patterns"
                  autoComplete="off"
                  className="min-w-0 flex-1 bg-transparent font-heading text-[28px] text-ink placeholder:text-muted-light !outline-none md:text-[40px] [&::-webkit-search-cancel-button]:hidden"
                />
                <button
                  type="button"
                  onClick={closeSearch}
                  aria-label="Close search"
                  className="inline-flex size-11 shrink-0 items-center justify-center text-ink hover:text-coral"
                >
                  <MaterialIcon name="close" size={24} color="currentColor" />
                </button>
              </form>

              {query.trim() ? (
                <div className="pt-6">
                  {suggestions.length > 0 ? (
                    <>
                      <ul className="grid grid-cols-1 gap-x-8 gap-y-1 md:grid-cols-2 lg:grid-cols-5 lg:gap-x-5">
                        {suggestions.map((p, i) => (
                          <li key={p.id}>
                            <Link
                              href={`/pattern/${p.slug}`}
                              onClick={closeSearch}
                              className="group flex items-center gap-4 py-2 lg:flex-col lg:items-start lg:gap-3"
                            >
                              <span
                                className="relative size-16 shrink-0 overflow-hidden rounded-[5px] lg:aspect-square lg:size-auto lg:w-full"
                                style={{ background: TILE_COLORS[i % TILE_COLORS.length] }}
                              >
                                {p.images?.[0] && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={deriveVariantUrl(p.images[0], 'micro')}
                                    alt=""
                                    loading="lazy"
                                    className="h-full w-full object-cover"
                                  />
                                )}
                              </span>
                              <span className="min-w-0">
                                <span className="line-clamp-2 block font-heading text-[17px] leading-snug text-ink group-hover:text-violet">
                                  {p.title}
                                </span>
                                <span className="mt-0.5 block text-[12px] font-semibold text-ink">
                                  {Number(p.price) === 0 ? 'Free' : `$${p.price.toFixed(2)}`}
                                </span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => submitSearch()}
                        className="mt-5 inline-flex min-h-11 items-center border-b-2 border-coral text-[11px] font-bold uppercase tracking-[0.14em] text-ink hover:text-violet"
                      >
                        See all results for &ldquo;{query.trim()}&rdquo; ↗
                      </button>
                    </>
                  ) : (
                    <p className="text-[14px] text-muted">
                      No patterns matched &ldquo;{query.trim()}&rdquo; yet. Press Enter to search the full catalogue.
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-6">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Popular</span>
                  {POPULAR_SEARCHES.map((s) => (
                    <Link
                      key={s.href}
                      href={s.href}
                      onClick={closeSearch}
                      className="inline-flex min-h-11 items-center rounded-[3px] border-2 border-ink px-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink transition-colors hover:bg-ink hover:text-white"
                    >
                      {s.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {searchOpen && (
        <button
          type="button"
          aria-label="Close search"
          tabIndex={-1}
          onClick={closeSearch}
          className="fixed inset-0 z-30 cursor-default bg-navy/35"
        />
      )}

      {/* Mobile / tablet menu */}
      {menuOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div ref={menuRef} className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <button type="button" aria-label="Close menu" tabIndex={-1} onClick={closeMenu} className="absolute inset-0 bg-navy/45" />
            <div className="absolute inset-y-0 right-0 flex w-[min(92vw,420px)] flex-col bg-bg shadow-2xl">
              <div className="flex h-[67px] shrink-0 items-center justify-between border-b border-border page-gutter">
                <Logo variant="compact" />
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={closeMenu}
                  className="-mr-2 inline-flex size-11 items-center justify-center text-ink"
                >
                  <MaterialIcon name="close" size={24} color="currentColor" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto page-gutter py-4" aria-label="Menu">
                <ul className="border-b border-border pb-3">
                  {[
                    { href: '/shop', label: 'Shop patterns' },
                    { href: '/shop?sort=newest', label: 'New arrivals' },
                    { href: '/shop?price=free', label: 'Free patterns' },
                    { href: '/#collections', label: 'Collections' },
                    { href: '/shop/sale', label: 'Sale' },
                    { href: '/about', label: 'Our story' },
                  ].map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} onClick={closeMenu} className="flex min-h-14 items-center font-heading text-[30px] leading-none text-ink hover:text-violet">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>

                <p className="pb-1 pt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Categories</p>
                <ul>
                  {categories.map((c) => {
                    const expanded = expandedCategory === c.id
                    const subs = subcategories[c.id]
                    return (
                      <li key={c.link} className="border-b border-border">
                        <div className="flex items-stretch">
                          <Link href={c.link} onClick={closeMenu} className="flex min-h-12 flex-1 items-center text-[15px] font-semibold text-ink">
                            {c.name}
                          </Link>
                          <button
                            type="button"
                            aria-label={`${expanded ? 'Hide' : 'Show'} ${c.name} subcategories`}
                            aria-expanded={expanded}
                            onClick={() => toggleCategory(c.id)}
                            className="inline-flex size-12 items-center justify-center text-ink"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 14 14"
                              fill="none"
                              aria-hidden
                              className={`transition-transform ${expanded ? 'rotate-45' : ''}`}
                            >
                              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                        {expanded && (
                          <ul className="pb-2 pl-4">
                            {subs === undefined ? (
                              <li className="py-2 text-[13px] text-muted">Loading…</li>
                            ) : subs.length === 0 ? (
                              <li className="py-2 text-[13px] text-muted">No subcategories</li>
                            ) : (
                              subs.map((sub) => (
                                <li key={sub.id}>
                                  <Link href={`/shop/${sub.slug}`} onClick={closeMenu} className="flex min-h-11 items-center text-[14px] text-muted hover:text-ink">
                                    {sub.name}
                                  </Link>
                                </li>
                              ))
                            )}
                          </ul>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </nav>

              <div className="shrink-0 border-t border-border bg-surface-warm page-gutter py-4">
                {authLoading ? null : user ? (
                  <div>
                    <p className="mb-2 truncate text-[13px] text-muted">{user.email}</p>
                    <div className="grid grid-cols-2 gap-x-4">
                      <Link href="/account/downloads" onClick={closeMenu} className="flex min-h-11 items-center text-[13px] font-semibold text-ink">
                        My downloads
                      </Link>
                      <Link href="/account/orders" onClick={closeMenu} className="flex min-h-11 items-center text-[13px] font-semibold text-ink">
                        Orders
                      </Link>
                      <Link href="/account/wishlist" onClick={closeMenu} className="flex min-h-11 items-center text-[13px] font-semibold text-ink">
                        Wishlist
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          closeMenu()
                          void signOut().then(() => {
                            if (pathname === '/account' || pathname.startsWith('/account/')) router.push('/')
                          })
                        }}
                        className="flex min-h-11 items-center text-left text-[13px] font-semibold text-ink"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <Link href="/account/wishlist" onClick={closeMenu} className="flex min-h-11 items-center text-[13px] font-semibold text-ink">
                      Wishlist
                    </Link>
                    <button
                      type="button"
                      onClick={goSignIn}
                      className="inline-flex min-h-11 items-center justify-center rounded-[3px] border-2 border-primary bg-primary px-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-white hover:border-violet hover:bg-violet"
                    >
                      Sign in
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

/** Desktop "Shop patterns" panel: categories, skill levels and quick links. */
function ShopMegaMenu({ categories, onClose }: { categories: CategoryWithCount[]; onClose: () => void }) {
  const colHead = 'mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet'
  const row =
    'flex min-h-11 items-center border-b border-border text-[14px] text-ink transition-colors hover:text-violet'
  return (
    <div className="absolute left-[-1rem] top-full z-50 pt-3">
      <div className="w-[min(780px,calc(100vw-4rem))] rounded-[5px] border-2 border-ink bg-bg p-7 shadow-[6px_6px_0_0_#111111]">
        <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-9">
          <div>
            <p className={colHead}>Categories</p>
            <ul>
              {categories.map((c) => (
                <li key={c.link}>
                  <Link href={c.link} onClick={onClose} className={row}>
                    <span className="truncate">{c.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className={colHead}>By skill level</p>
            <ul>
              {[
                { href: '/shop?level=beginner', label: 'Beginner' },
                { href: '/shop?level=intermediate', label: 'Intermediate' },
                { href: '/shop?level=advanced', label: 'Advanced' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={onClose} className={row}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className={colHead}>Quick links</p>
            <ul>
              {[
                { href: '/shop', label: 'All patterns' },
                { href: '/shop?sort=newest', label: 'New arrivals' },
                { href: '/shop?price=free', label: 'Free patterns' },
                { href: '/shop/sale', label: 'Sale' },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={onClose}
                    className="flex min-h-11 items-center font-heading text-[22px] leading-none text-ink transition-colors hover:text-coral"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function AccountDropdown({
  profile,
  email,
  onClose,
  onSignOut,
}: {
  profile: { name?: string | null } | null
  email?: string
  onClose: () => void
  onSignOut: () => void
}) {
  const item = 'flex min-h-11 items-center px-5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-warm hover:text-violet'
  return (
    <div className="absolute right-0 top-full z-50 pt-3">
      <div className="w-[260px] overflow-hidden rounded-[5px] border-2 border-ink bg-bg shadow-[6px_6px_0_0_#111111]">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[5px] bg-violet text-[15px] font-semibold text-white">
            {profileInitial(profile, email)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-ink">{profileDisplayName(profile, 'My Account')}</p>
            <p className="truncate text-[12px] text-muted">{email}</p>
          </div>
        </div>
        <div className="py-1.5">
          <Link href="/account/downloads" onClick={onClose} className={item}>
            My downloads
          </Link>
          <Link href="/account/orders" onClick={onClose} className={item}>
            Orders
          </Link>
          <Link href="/account/wishlist" onClick={onClose} className={item}>
            Wishlist
          </Link>
          <Link href="/account/profile" onClick={onClose} className={item}>
            Account settings
          </Link>
        </div>
        <div className="border-t border-border py-1.5">
          <button type="button" onClick={onSignOut} className={`${item} w-full text-left`}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
