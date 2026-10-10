'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'
import { searchProducts } from '../lib/productSearch'
import { getCategoriesWithProducts, getSubcategoriesWithCounts, type CategoryWithCount, type SubcategoryWithCount } from '../lib/categories'
import { deriveVariantUrl } from '../lib/imageVariants'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'
import type { Product } from '../lib/types'
import { profileDisplayName, profileInitial } from '../lib/profileName'
import { MaterialIcon } from './MaterialIcon'
import { Logo } from './Logo'
import { SettingsIcon, DownloadCircleIcon, CloseCircleIcon, OrderIcon, UI_ICON_SIZE } from './icons'

const HEADER_ICON = '#111111'

export function Header() {
  const { user, profile, signOut, loading: authLoading } = useAuth()
  const { requireAuth } = useUI()
  const { count: cartCount, openDrawer } = useCart()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false)
  useBodyScrollLock(mobileOpen || mobileAccountOpen)
  const [desktopAccountOpen, setDesktopAccountOpen] = useState(false)
  const desktopAccountWrapRef = useRef<HTMLDivElement>(null)
  const tabletAccountWrapRef = useRef<HTMLDivElement>(null)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const categoriesWrapRef = useRef<HTMLDivElement>(null)
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [mobileExpandedCategory, setMobileExpandedCategory] = useState<string | null>(null)
  const [mobileSubcategoriesCache, setMobileSubcategoriesCache] = useState<Record<string, SubcategoryWithCount[]>>({})
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [searchFocused, setSearchFocused] = useState(false)
  const searchWrapRef = useRef<HTMLDivElement>(null)
  const desktopSearchInputRef = useRef<HTMLInputElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const [browsePanelTop, setBrowsePanelTop] = useState(0)

  const closeMobileBrowse = () => {
    setMobileOpen(false)
    setMobileExpandedCategory(null)
  }

  const updateBrowsePanelTop = () => {
    if (!headerRef.current) return
    setBrowsePanelTop(headerRef.current.getBoundingClientRect().bottom)
  }

  useEffect(() => {
    getCategoriesWithProducts(supabase).then(setCategories)
  }, [])

  useEffect(() => {
    if (!query.trim()) return setSuggestions([])
    const timer = setTimeout(() => {
      searchProducts(query, 5).then(setSuggestions)
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (!(searchWrapRef.current?.contains(t) ?? false)) setSearchFocused(false)
      if (
        !(desktopAccountWrapRef.current?.contains(t) ?? false) &&
        !(tabletAccountWrapRef.current?.contains(t) ?? false)
      ) {
        setDesktopAccountOpen(false)
      }
      if (categoriesWrapRef.current && !categoriesWrapRef.current.contains(t)) setCategoriesOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    if (pathname !== '/search') return
    const activeQuery = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('q') ?? ''
    setQuery(activeQuery)
  }, [pathname, typeof window !== 'undefined' ? window.location.search : ''])

  useLayoutEffect(() => {
    if (!mobileOpen) return
    updateBrowsePanelTop()
    window.addEventListener('resize', updateBrowsePanelTop)
    return () => window.removeEventListener('resize', updateBrowsePanelTop)
  }, [mobileOpen])

  const submitSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim()) return
    setSearchFocused(false)
    desktopSearchInputRef.current?.blur()
    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const clearSearch = () => {
    setQuery('')
    setSuggestions([])
    if (pathname === '/search') router.push('/search')
  }

  const goWishlist = () => {
    router.push('/account/wishlist')
  }

  const openCart = () => {
    openDrawer()
  }

  const openMobileCart = () => {
    router.push('/cart')
  }

  const signInFromMobile = () => {
    closeMobileBrowse()
    requireAuth()
  }

  const signOutFromDrawer = async () => {
    closeMobileBrowse()
    await signOut()
    if (pathname === '/account' || pathname.startsWith('/account/')) router.push('/')
  }

  return (
    <>
    <header ref={headerRef} className="sticky top-0 z-40 bg-canvas border-b border-line">
      <div className="relative z-[3] bg-canvas">
      {/* AnnouncementBar lives in CustomerShell (DESIGN_SPEC §3.1). */}

      {/* ── Desktop ≥1024: logo + text nav | search | heart, cart, Sign in ── */}
      <div className="hidden desktop:flex items-center gap-4 lg:gap-6 px-6 md:px-10 lg:px-8 py-3.5 max-w-site w-full">
        <Logo variant="full" />
        <nav className="hidden lg:flex items-center gap-5 shrink-0" aria-label="Primary">
          {[
            { href: '/shop', label: 'Shop' },
            { href: '/shop?level=beginner', label: 'Skill levels' },
            { href: '/shop?price=free', label: 'Free patterns' },
            { href: '/#reviews', label: 'Reviews' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="text-[13px] font-medium text-ink whitespace-nowrap hover:text-primary">
              {l.label}
            </Link>
          ))}
        </nav>
        <div ref={categoriesWrapRef} className="relative lg:hidden shrink-0">
          <button
            type="button"
            onClick={() => { setMobileOpen(false); setCategoriesOpen((v) => !v) }}
            aria-label="Browse categories"
            aria-expanded={categoriesOpen}
            className="flex items-center gap-2 h-10 px-2 rounded-full hover:bg-surface-warm transition-colors"
          >
            <MaterialIcon name="menu" size={20} color={HEADER_ICON} />
            <span className="text-[13px] font-medium text-ink whitespace-nowrap">Shop</span>
          </button>
          {categoriesOpen && (
            <DesktopCategoriesMenu
              categories={categories}
              onClose={() => setCategoriesOpen(false)}
            />
          )}
        </div>

        <div className="flex items-center gap-4 min-w-0 flex-1 justify-end">
          <div ref={searchWrapRef} className="relative min-w-0 flex-1 max-w-[280px]">
            <SearchPill
              inputRef={desktopSearchInputRef}
              query={query}
              setQuery={setQuery}
              onFocus={() => setSearchFocused(true)}
              onSubmit={submitSearch}
              onClear={clearSearch}
              placeholder="Search patterns"
              buttonSize={36}
              iconSize={18}
            />
            {searchFocused && query && (
              <SuggestionsDropdown
                suggestions={suggestions}
                query={query}
                onPick={() => { setSearchFocused(false); desktopSearchInputRef.current?.blur() }}
                onSeeAll={() => submitSearch()}
              />
            )}
          </div>

          <HeaderActions
            wrapRef={desktopAccountWrapRef}
            iconSize={22}
            cartCount={cartCount}
            onCart={openCart}
            user={user}
            profile={profile}
            requireAuth={requireAuth}
            signOut={signOut}
            accountOpen={desktopAccountOpen}
            setAccountOpen={setDesktopAccountOpen}
            onWishlist={goWishlist}
            showWishlist
            signInPill
          />
        </div>
      </div>

      {/* ── Tablet 768–1023: logo | search, heart, cart, hamburger (DESIGN_SPEC) ── */}
      <div className="hidden tablet:flex desktop:hidden items-center justify-between gap-4 px-5 py-3 max-w-site w-full">
        <Logo variant="full" />
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            aria-label="Search patterns"
            onClick={() => router.push('/search')}
            className="touch-target w-11 h-11 flex items-center justify-center hover:opacity-70"
          >
            <MaterialIcon name="search" size={22} color={HEADER_ICON} />
          </button>
          <button
            type="button"
            aria-label="Wishlist"
            onClick={goWishlist}
            className="touch-target w-11 h-11 flex items-center justify-center hover:opacity-70"
          >
            <MaterialIcon name="favorite" size={22} color={HEADER_ICON} />
          </button>
          <HeaderAccountIcon
            signedIn={!!user}
            loading={authLoading}
            onSignIn={signInFromMobile}
            onNavigate={closeMobileBrowse}
          />
          <button
            type="button"
            aria-label="Cart"
            onClick={openCart}
            className="relative touch-target w-11 h-11 flex items-center justify-center hover:opacity-70"
          >
            <MaterialIcon name="shopping_bag" size={22} color={HEADER_ICON} />
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full text-white text-[9px] flex items-center justify-center bg-primary">
                {cartCount}
              </span>
            )}
          </button>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => { setCategoriesOpen(false); setMobileExpandedCategory(null); setMobileOpen((v) => !v) }}
            className={`touch-target w-11 h-11 flex items-center justify-center rounded-full ${mobileOpen ? 'bg-surface-warm' : ''}`}
          >
            <MaterialIcon name="menu" size={22} color={HEADER_ICON} />
          </button>
        </div>
      </div>

      {/* ── Mobile <768: hamburger, logo, search icon, cart (no heart) ── */}
      <div className="tablet:hidden relative z-50">
        <div className="px-3 py-2 flex items-center gap-1 bg-canvas">
          <button
            type="button"
            onClick={() => { setMobileExpandedCategory(null); setMobileOpen((v) => !v) }}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            className={`touch-target w-11 h-11 shrink-0 -ml-1 flex items-center justify-center ${mobileOpen ? 'rounded-full bg-surface-warm' : ''}`}
          >
            <MaterialIcon name="menu" size={22} color={HEADER_ICON} />
          </button>
          <div className="flex-1 min-w-0 flex justify-center max-[360px]:justify-start">
            <Logo variant="full" />
          </div>
          <button
            type="button"
            aria-label="Search patterns"
            onClick={() => router.push('/search')}
            className="touch-target w-11 h-11 shrink-0 flex items-center justify-center hover:opacity-70"
          >
            <MaterialIcon name="search" size={22} color={HEADER_ICON} />
          </button>
          <HeaderAccountIcon
            signedIn={!!user}
            loading={authLoading}
            onSignIn={signInFromMobile}
            onNavigate={closeMobileBrowse}
          />
          <button
            type="button"
            aria-label="Cart"
            onClick={openCart}
            className="relative touch-target w-11 h-11 shrink-0 flex items-center justify-center hover:opacity-70"
          >
            <MaterialIcon name="shopping_bag" size={22} color={HEADER_ICON} />
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full text-white text-[9px] flex items-center justify-center bg-primary">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
      </div>

      {mobileAccountOpen && (
        <div className="fixed inset-0 z-50 tablet:hidden">
          <div className="absolute inset-0 bg-canvas flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-line">
              <span className="font-subheading text-lg">{user ? 'My Account' : 'Account'}</span>
              <button type="button" aria-label="Close menu" onClick={() => setMobileAccountOpen(false)} className="p-1">
                <CloseCircleIcon size={28} />
              </button>
            </div>

            {user ? (
              <>
                <div className="h-1" style={{ background: 'var(--color-accent)' }} />
                <div className="px-6 py-5 border-b border-line flex items-center gap-3" style={{ background: 'var(--color-surface)' }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white font-semibold" style={{ background: 'var(--color-accent)' }}>
                    {profileInitial(profile, user.email)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium truncate">{profileDisplayName(profile, 'My Account')}</p>
                    <p className="text-[12px] text-ink-soft truncate">{user.email}</p>
                  </div>
                </div>
                <nav className="flex flex-col py-2 overflow-y-auto flex-1 pb-20">
                  <Link href="/account/orders" onClick={() => setMobileAccountOpen(false)} className="flex items-center gap-3 px-6 py-3.5 text-[13px] text-ink">
                    <OrderIcon size={UI_ICON_SIZE} /> Orders
                  </Link>
                  <Link href="/account/downloads" onClick={() => setMobileAccountOpen(false)} className="flex items-center gap-3 px-6 py-3.5 text-[13px] text-ink">
                    <DownloadCircleIcon size={UI_ICON_SIZE} /> Downloads
                  </Link>
                  <Link href="/account/wishlist" onClick={() => setMobileAccountOpen(false)} className="flex items-center gap-3 px-6 py-3.5 text-[13px] text-ink">
                    <MaterialIcon name="favorite" size={18} /> Wishlist
                  </Link>
                  <div className="border-t border-line mt-2 pt-2">
                    <Link href="/account/profile" onClick={() => setMobileAccountOpen(false)} className="flex items-center gap-3 px-6 py-3.5 text-[13px] text-ink">
                      <SettingsIcon size={UI_ICON_SIZE} /> Account settings
                    </Link>
                  </div>
                  <div className="border-t border-line mt-2 pt-2">
                    <button type="button" onClick={() => { signOut(); setMobileAccountOpen(false) }} className="w-full flex items-center gap-3 px-6 py-3.5 text-[13px] text-ink">
                      <MaterialIcon name="logout" size={18} /> Sign out
                    </button>
                  </div>
                </nav>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
                <MaterialIcon name="person" size={36} />
                <p className="text-[14px] text-ink-soft">Sign in to see your orders and downloads.</p>
                <button
                  type="button"
                  onClick={() => { setMobileAccountOpen(false); requireAuth() }}
                  className="px-6 py-3 rounded-full text-white text-[13px] font-semibold"
                  style={{ background: 'var(--color-accent)' }}
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>

    {/* Browse panel — mobile + tablet; portaled so overlay covers full viewport (not clipped by sticky header). */}
    {mobileOpen && typeof document !== 'undefined' && createPortal(
      <>
        <div
          className="fixed inset-0 z-[45] bg-black/25 desktop:hidden"
          onClick={closeMobileBrowse}
          aria-hidden="true"
        />
        <div
          className="fixed left-0 right-0 z-[46] bg-[#faf9f5] border-b border-[#ddd] shadow-[0_12px_28px_rgba(0,0,0,0.14)] overflow-y-auto desktop:hidden"
          style={{ top: browsePanelTop, maxHeight: `min(78vh, calc(100vh - ${browsePanelTop}px))` }}
        >
          <div className="relative flex items-center justify-center px-12 pt-3.5 pb-2.5">
            <h2 className="text-[17px] font-semibold text-black tracking-[-0.02em] leading-none">
              Browse Categories
            </h2>
            <button
              type="button"
              aria-label="Close categories"
              onClick={closeMobileBrowse}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-[#595959]"
            >
              <MaterialIcon name="close" size={22} />
            </button>
          </div>
          {!authLoading && (
            <div className="px-5 pt-1 pb-3">
              {user ? (
                <Link
                  href="/account/downloads"
                  onClick={closeMobileBrowse}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-full border-[1.5px] border-primary px-5 text-[14px] font-semibold text-primary hover:bg-primary-soft"
                >
                  <MaterialIcon name="person" size={18} /> My account
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={signInFromMobile}
                  className="flex w-full min-h-11 items-center justify-center rounded-full bg-primary px-5 text-[14px] font-semibold text-white hover:opacity-90"
                >
                  Sign in
                </button>
              )}
            </div>
          )}
          <nav className="pb-3">
            <Link
              href="/shop/new"
              onClick={closeMobileBrowse}
              className="flex items-center px-5 py-3.5 text-[16px] font-semibold text-black tracking-[-0.02em] leading-snug border-b border-[#ebe8e2]"
            >
              New Arrivals
            </Link>
            {categories.map((c) => {
              const expanded = mobileExpandedCategory === c.id
              const subs = mobileSubcategoriesCache[c.id]
              const hasSubsCached = subs !== undefined
              return (
                <div key={c.link} className="border-b border-[#ebe8e2]">
                  <div className="flex items-stretch">
                    <Link
                      href={c.link}
                      onClick={closeMobileBrowse}
                      className="flex-1 px-5 py-3.5 text-[16px] font-semibold text-black tracking-[-0.02em] leading-snug"
                    >
                      {c.name}
                    </Link>
                    <button
                      type="button"
                      aria-label={`${expanded ? 'Hide' : 'Show'} ${c.name} subcategories`}
                      aria-expanded={expanded}
                      onClick={() => {
                        const opening = !expanded
                        setMobileExpandedCategory(opening ? c.id : null)
                        if (opening && !hasSubsCached) {
                          getSubcategoriesWithCounts(supabase, c.id).then((list) =>
                            setMobileSubcategoriesCache((prev) => ({ ...prev, [c.id]: list }))
                          )
                        }
                      }}
                      className="px-4 text-black"
                    >
                      <MaterialIcon
                        name="chevron_right"
                        size={22}
                        style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}
                      />
                    </button>
                  </div>
                  {expanded && (
                    <div className="bg-[#f0eee8] pb-1">
                      {(subs?.length ?? 0) === 0 && hasSubsCached ? (
                        <p className="px-8 py-2 text-[13px] text-[#666]">No subcategories</p>
                      ) : (
                        (subs ?? []).map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/shop/${sub.slug}`}
                            onClick={closeMobileBrowse}
                            className="block px-8 py-2.5 text-[15px] font-semibold text-black tracking-[-0.015em]"
                          >
                            {sub.name}
                          </Link>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            <Link href="/shop" onClick={closeMobileBrowse} className="flex items-center px-5 py-3.5 text-[16px] font-semibold text-black tracking-[-0.02em] leading-snug border-b border-[#ebe8e2]">
              All Patterns
            </Link>
            <Link href="/shop?price=free" onClick={closeMobileBrowse} className="flex items-center px-5 py-3.5 text-[16px] font-semibold text-black tracking-[-0.02em] leading-snug border-b border-[#ebe8e2]">
              Free Patterns
            </Link>
            <Link href="/shop/sale" onClick={closeMobileBrowse} className="flex items-center px-5 py-3.5 text-[16px] font-semibold text-black tracking-[-0.02em] leading-snug">
              Sale
            </Link>
            {!authLoading && user && (
              <button
                type="button"
                onClick={() => { void signOutFromDrawer() }}
                className="flex w-full items-center gap-2.5 px-5 py-3.5 text-[16px] font-semibold text-black tracking-[-0.02em] leading-snug border-t border-[#ebe8e2]"
              >
                <MaterialIcon name="logout" size={20} /> Sign out
              </button>
            )}
          </nav>
        </div>
      </>,
      document.body,
    )}
    </>
  )
}

function HeaderActions({
  wrapRef,
  iconSize,
  cartCount,
  onCart,
  onWishlist,
  user,
  profile,
  requireAuth,
  signOut,
  accountOpen,
  setAccountOpen,
  gapClass = 'gap-3',
  showWishlist = true,
  signInPill = false,
}: {
  wrapRef: React.RefObject<HTMLDivElement | null>
  iconSize: number
  cartCount: number
  onCart: () => void
  onWishlist: () => void
  user: { email?: string } | null
  profile: { name?: string | null } | null
  requireAuth: () => boolean
  signOut: () => void
  accountOpen: boolean
  setAccountOpen: React.Dispatch<React.SetStateAction<boolean>>
  gapClass?: string
  showWishlist?: boolean
  signInPill?: boolean
}) {
  return (
    <div className={`flex items-center ${gapClass} shrink-0 text-ink`}>
      {showWishlist && (
        <button
          type="button"
          aria-label="Wishlist"
          title={user ? 'Wishlist' : 'Wishlist — items saved for 7 days while signed out'}
          onClick={onWishlist}
          className="touch-target w-11 h-11 flex items-center justify-center hover:opacity-70 transition-opacity"
        >
          <MaterialIcon name="favorite" size={iconSize} color={HEADER_ICON} />
        </button>
      )}
      <button
        type="button"
        onClick={onCart}
        aria-label="Cart"
        title={user ? 'Cart' : 'Cart — items saved for 7 days while signed out'}
        className="relative touch-target w-11 h-11 flex items-center justify-center hover:opacity-70 transition-opacity"
      >
        <MaterialIcon name="shopping_bag" size={iconSize} color={HEADER_ICON} />
        {cartCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full text-white text-[9px] flex items-center justify-center bg-primary">
            {cartCount}
          </span>
        )}
      </button>
      {signInPill && !user ? (
        <button
          type="button"
          onClick={() => requireAuth()}
          className="ml-1 inline-flex min-h-11 items-center rounded-full border-[1.5px] border-primary px-5 text-[13px] font-semibold text-primary hover:bg-primary-soft"
        >
          Sign in
        </button>
      ) : (
        <HeaderAccountControl
          wrapRef={wrapRef}
          iconSize={iconSize}
          open={accountOpen}
          setOpen={setAccountOpen}
          user={user}
          profile={profile}
          requireAuth={requireAuth}
          signOut={signOut}
        />
      )}
    </div>
  )
}

/** Phone + tablet account entry. Same 44px box in every auth state so the row never shifts. */
function HeaderAccountIcon({
  signedIn,
  loading,
  onSignIn,
  onNavigate,
}: {
  signedIn: boolean
  loading: boolean
  onSignIn: () => void
  onNavigate: () => void
}) {
  const className = 'touch-target w-11 h-11 shrink-0 rounded-full flex items-center justify-center hover:opacity-70'
  const icon = <MaterialIcon name="person" size={22} color={HEADER_ICON} />
  if (loading) {
    return <span aria-hidden="true" className={className}>{icon}</span>
  }
  if (signedIn) {
    return (
      <Link href="/account/downloads" aria-label="My account" onClick={onNavigate} className={className}>
        {icon}
      </Link>
    )
  }
  return (
    <button type="button" aria-label="Sign in" onClick={onSignIn} className={className}>
      {icon}
    </button>
  )
}

function SearchPill({
  inputRef,
  query,
  setQuery,
  onFocus,
  onSubmit,
  onClear,
  placeholder,
  buttonSize,
  iconSize,
  leading,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>
  query: string
  setQuery: (v: string) => void
  onFocus: () => void
  onSubmit: (e?: React.FormEvent) => void
  onClear: () => void
  placeholder: string
  buttonSize: number
  iconSize: number
  leading?: React.ReactNode
}) {
  return (
    <form onSubmit={onSubmit} className="relative flex items-center border-2 border-ink rounded-full bg-white pl-0.5 pr-1.5 focus-within:ring-2 focus-within:ring-ink/20">
      {leading}
      {leading && <div className="w-px self-stretch my-2.5 bg-line shrink-0" />}
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        className={`flex-1 min-w-0 bg-transparent py-2.5 pr-2 text-[14px] placeholder:text-ink-soft focus:outline-none ${leading ? 'pl-2' : 'pl-4'}`}
      />
      {query && (
        <button type="button" onClick={onClear} aria-label="Clear search" className="shrink-0 w-6 h-6 flex items-center justify-center text-ink-soft hover:text-ink mr-1">
          <MaterialIcon name="close" size={16} color={HEADER_ICON} />
        </button>
      )}
      <button
        type="submit"
        aria-label="Search"
        className="shrink-0 rounded-full text-white flex items-center justify-center hover:opacity-90 transition-opacity"
        style={{ width: buttonSize, height: buttonSize, background: 'var(--color-accent)' }}
      >
        <MaterialIcon name="search" size={iconSize} />
      </button>
    </form>
  )
}

function SuggestionsDropdown({
  suggestions,
  query,
  onPick,
  onSeeAll,
}: {
  suggestions: Product[]
  query: string
  onPick: () => void
  onSeeAll: () => void
}) {
  return (
    <div className="absolute left-0 right-0 top-full mt-2 bg-canvas border border-line shadow-lg z-50 max-h-96 overflow-y-auto rounded-lg">
      {suggestions.length > 0 ? (
        <>
          {suggestions.map((p) => (
            <Link
              key={p.id}
              href={`/pattern/${p.slug}`}
              onClick={onPick}
              className="flex items-center gap-3 px-4 py-3 hover:bg-surface"
            >
              <div className="w-10 h-10 shrink-0 bg-surface rounded-md overflow-hidden">
                {p.images?.[0] && <img src={deriveVariantUrl(p.images[0], 'micro')} alt={p.title} loading="lazy" className="w-full h-full object-cover" />}
              </div>
              <span className="text-[13px] truncate">{p.title}</span>
              <span className="ml-auto text-[12px] text-ink-soft shrink-0">${p.price.toFixed(2)}</span>
            </Link>
          ))}
          <button type="button" onClick={onSeeAll} className="block w-full text-left px-4 py-3 text-[12px] tracking-[0.08em] text-ink-soft hover:text-ink border-t border-line">
            SEE ALL RESULTS FOR "{query.toUpperCase()}" →
          </button>
        </>
      ) : (
        <p className="px-4 py-4 text-[13px] text-ink-soft">No patterns matched "{query}"</p>
      )}
    </div>
  )
}

function DesktopCategoriesMenu({
  categories,
  onClose,
}: {
  categories: CategoryWithCount[]
  onClose: () => void
}) {
  return (
    <div className="absolute left-0 top-full mt-2 z-50 w-[280px]">
      <div className="bg-white border border-line rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-hidden">
        <div className="max-h-[min(420px,70vh)] overflow-y-auto py-1.5" style={{ scrollbarWidth: 'thin' }}>
          <Link
            href="/shop"
            onClick={onClose}
            className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-ink hover:bg-surface transition-colors"
          >
            <MaterialIcon name="auto_awesome" size={16} color="var(--color-logo-accent)" />
            Recommended categories
          </Link>
          <div className="mx-4 mb-1.5 border-b" style={{ borderColor: 'var(--color-accent)' }} />
          {categories.map((c) => (
            <Link
              key={c.link}
              href={c.link}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-ink hover:bg-surface transition-colors"
            >
              <span className="flex-1 truncate">{c.name}</span>
              <MaterialIcon name="chevron_right" size={16} className="text-ink-soft shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function HeaderAccountControl({
  wrapRef,
  iconSize,
  open,
  setOpen,
  user,
  profile,
  requireAuth,
  signOut,
}: {
  wrapRef: React.RefObject<HTMLDivElement | null>
  iconSize: number
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  user: { email?: string } | null
  profile: { name?: string | null } | null
  requireAuth: () => boolean
  signOut: () => void
}) {
  if (!user) {
    return (
      <button
        type="button"
        onClick={() => { requireAuth() }}
        className="h-10 px-1 text-[13px] font-medium text-ink hover:opacity-70 transition-opacity whitespace-nowrap shrink-0"
      >
        Sign in
      </button>
    )
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-10 h-10 flex items-center justify-center hover:opacity-70 transition-opacity"
        aria-label="Your account"
        title="Your account"
        aria-expanded={open}
      >
        <MaterialIcon name="person" size={iconSize} color={HEADER_ICON} />
      </button>
      {open && (
        <AccountDropdown
          profile={profile}
          email={user.email}
          onClose={() => setOpen(false)}
          onSignOut={() => { signOut(); setOpen(false) }}
        />
      )}
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
  return (
    <div className="absolute right-0 top-full pt-2 z-50">
      <div className="w-[260px] bg-white border border-line shadow-[0_8px_30px_rgba(0,0,0,0.12)] text-sm rounded-xl overflow-hidden">
        <div className="h-1" style={{ background: 'var(--color-accent)' }} />
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-line" style={{ background: 'var(--color-surface)' }}>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-[14px] font-semibold"
            style={{ background: 'var(--color-accent)' }}
          >
            {profileInitial(profile, email)}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-ink truncate">
              {profileDisplayName(profile, 'My Account')}
            </p>
            <p className="text-[11px] text-ink-soft truncate">{email}</p>
          </div>
        </div>
        <div className="py-1.5">
          <Link href="/account/orders" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface text-[13px] text-ink">
            <OrderIcon size={UI_ICON_SIZE} /> Orders
          </Link>
          <Link href="/account/downloads" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface text-[13px] text-ink">
            <DownloadCircleIcon size={UI_ICON_SIZE} /> Downloads
          </Link>
          <Link href="/account/wishlist" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface text-[13px] text-ink">
            <MaterialIcon name="favorite" size={18} /> Wishlist
          </Link>
        </div>
        <div className="border-t border-line py-1.5">
          <Link href="/account/profile" onClick={onClose} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface text-[13px] text-ink">
            <SettingsIcon size={UI_ICON_SIZE} /> Account settings
          </Link>
          <button type="button" onClick={onSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface text-[13px] text-ink text-left">
            <MaterialIcon name="logout" size={18} /> Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
