'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'
import { getCategoriesWithProducts, getSubcategoriesWithCounts, type CategoryWithCount, type SubcategoryWithCount } from '../lib/categories'
import { deriveVariantUrl } from '../lib/imageVariants'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'
import type { AnnouncementsContent, Product } from '../lib/types'
import { MaterialIcon } from './MaterialIcon'
import { Logo } from './Logo'
import { SettingsIcon, DownloadCircleIcon, CloseCircleIcon, OrderIcon, CartIcon, UI_ICON_SIZE } from './icons'

const HEADER_ICON = '#111111'

export function Header() {
  const { user, profile, signOut } = useAuth()
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
  const [messages, setMessages] = useState<string[]>(['FREE PATTERN WITH EVERY FIRST ORDER — CODE FIRSTSTITCH'])
  const [messageIndex, setMessageIndex] = useState(0)

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [searchFocused, setSearchFocused] = useState(false)
  const searchWrapRef = useRef<HTMLDivElement>(null)
  const tabletSearchWrapRef = useRef<HTMLDivElement>(null)
  const mobileSearchWrapRef = useRef<HTMLDivElement>(null)
  const desktopSearchInputRef = useRef<HTMLInputElement>(null)
  const tabletSearchInputRef = useRef<HTMLInputElement>(null)
  const mobileSearchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'announcements').maybeSingle().then(({ data }) => {
      const content = data?.value as AnnouncementsContent | undefined
      if (content?.messages?.length) setMessages(content.messages)
    })
    getCategoriesWithProducts().then(setCategories)
  }, [])

  useEffect(() => {
    if (messages.length <= 1) return
    const timer = setInterval(() => setMessageIndex((i) => (i + 1) % messages.length), 4000)
    return () => clearInterval(timer)
  }, [messages])

  useEffect(() => {
    if (!query.trim()) return setSuggestions([])
    const timer = setTimeout(() => {
      supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(5)
        .then(({ data }) => setSuggestions((data as Product[]) ?? []))
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node
      const insideSearch =
        (searchWrapRef.current?.contains(t) ?? false) ||
        (tabletSearchWrapRef.current?.contains(t) ?? false) ||
        (mobileSearchWrapRef.current?.contains(t) ?? false)
      if (!insideSearch) setSearchFocused(false)
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

  const submitSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim()) return
    setSearchFocused(false)
    desktopSearchInputRef.current?.blur()
    tabletSearchInputRef.current?.blur()
    mobileSearchInputRef.current?.blur()
    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const clearSearch = () => {
    setQuery('')
    setSuggestions([])
    if (pathname === '/search') router.push('/search')
  }

  const goWishlist = () => {
    if (requireAuth()) window.location.href = '/account/wishlist'
  }

  const openCart = () => {
    if (user) openDrawer()
    else requireAuth()
  }

  const openMobileCart = () => {
    if (user) router.push('/cart')
    else requireAuth()
  }

  return (
    <header className="sticky top-0 z-40 bg-canvas border-b border-line">
      {/* Promo bar — unchanged */}
      <div
        className="hidden md:flex items-center justify-between text-white text-[11px] tracking-[0.04em] px-6 lg:px-10 py-2 max-w-site w-full mx-auto"
        style={{ background: 'var(--color-primary)' }}
      >
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5"><MaterialIcon name="download" size={13} /> Instant PDF Download</span>
          <span className="flex items-center gap-1.5"><MaterialIcon name="menu_book" size={13} /> Easy to Follow</span>
          <span className="flex items-center gap-1.5"><MaterialIcon name="favorite" size={13} /> Made with Love</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/shop?price=free" className="hover:opacity-80 transition-opacity">Free Patterns</Link>
          <Link href="/faq" className="hover:opacity-80 transition-opacity">Help &amp; FAQ</Link>
        </div>
      </div>
      <div className="md:hidden text-white text-[11px] tracking-[0.1em] text-center py-2 px-4 h-[32px] flex items-center justify-center overflow-hidden" style={{ background: 'var(--color-primary)' }}>
        <span key={messageIndex} className="animate-[fadeIn_0.4s_ease-out]">{messages[messageIndex]}</span>
      </div>

      {/* ── Desktop ≥1024 (lg): Logo | capped Search (centered) | Account | Wishlist | Cart ── */}
      <div className="hidden lg:flex items-center justify-between gap-5 px-6 xl:px-8 py-3.5 max-w-site w-full mx-auto">
        <div className="shrink-0">
          <Logo variant="full" />
        </div>

        <div className="flex-1 flex items-center justify-center min-w-0 px-2">
          <div ref={searchWrapRef} className="relative w-full max-w-[600px] min-w-0">
            <div ref={categoriesWrapRef} className="relative">
              <SearchPill
                inputRef={desktopSearchInputRef}
                query={query}
                setQuery={setQuery}
                onFocus={() => setSearchFocused(true)}
                onSubmit={submitSearch}
                onClear={clearSearch}
                placeholder="Search"
                buttonSize={36}
                iconSize={18}
                leading={
                  <button
                    type="button"
                    onClick={() => setCategoriesOpen((v) => !v)}
                    aria-label="Browse categories"
                    aria-expanded={categoriesOpen}
                    className="shrink-0 flex items-center justify-center w-10 h-10 rounded-l-full hover:bg-surface transition-colors"
                  >
                    <MaterialIcon name="menu" size={20} color={HEADER_ICON} />
                  </button>
                }
              />
              {categoriesOpen && (
                <DesktopCategoriesMenu
                  categories={categories}
                  onClose={() => setCategoriesOpen(false)}
                />
              )}
            </div>
            {searchFocused && query && (
              <SuggestionsDropdown
                suggestions={suggestions}
                query={query}
                onPick={() => { setSearchFocused(false); desktopSearchInputRef.current?.blur() }}
                onSeeAll={() => submitSearch()}
              />
            )}
          </div>
          {pathname === '/search' && (
            <button
              type="button"
              onClick={() => { clearSearch(); router.push('/'); desktopSearchInputRef.current?.blur() }}
              className="text-[13px] text-ink-soft hover:text-ink shrink-0 ml-3"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-[#111111]">
          <HeaderAccountControl
            wrapRef={desktopAccountWrapRef}
            iconSize={24}
            open={desktopAccountOpen}
            setOpen={setDesktopAccountOpen}
            user={user}
            profile={profile}
            requireAuth={requireAuth}
            signOut={signOut}
          />

          <button
            type="button"
            aria-label="Wishlist"
            title="Wishlist"
            onClick={goWishlist}
            className="w-10 h-10 flex items-center justify-center hover:opacity-70 transition-opacity"
          >
            <MaterialIcon name="favorite" size={24} color={HEADER_ICON} filled />
          </button>

          <button
            type="button"
            onClick={openCart}
            aria-label="Cart"
            title="Cart"
            className="relative w-10 h-10 flex items-center justify-center hover:opacity-70 transition-opacity"
          >
            <CartIcon size={24} color={HEADER_ICON} />
            {cartCount > 0 && (
              <span
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center"
                style={{ background: 'var(--color-accent)' }}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Tablet 768–1023 (md–lg): two rows ── */}
      <div className="hidden md:block lg:hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-3 max-w-site w-full mx-auto">
          <Logo variant="full" />
          <div className="flex items-center gap-0.5 shrink-0 text-[#111111]">
            <HeaderAccountControl
              wrapRef={tabletAccountWrapRef}
              iconSize={22}
              open={desktopAccountOpen}
              setOpen={setDesktopAccountOpen}
              user={user}
              profile={profile}
              requireAuth={requireAuth}
              signOut={signOut}
            />
            <button type="button" aria-label="Wishlist" title="Wishlist" onClick={goWishlist} className="w-10 h-10 flex items-center justify-center">
              <MaterialIcon name="favorite" size={22} color={HEADER_ICON} filled />
            </button>
            <button type="button" aria-label="Cart" title="Cart" onClick={openCart} className="relative w-10 h-10 flex items-center justify-center">
              <CartIcon size={22} color={HEADER_ICON} />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 pb-3 max-w-site w-full mx-auto">
          <button
            type="button"
            aria-label="Browse categories"
            onClick={() => { setMobileExpandedCategory(null); setMobileOpen((v) => !v) }}
            className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-full ${mobileOpen ? 'bg-[#ececec]' : ''}`}
          >
            <MaterialIcon name="menu" size={22} color={HEADER_ICON} />
          </button>
          {/* Tablet row 2: full remaining width — no max-w cap (cap is lg+ only) */}
          <div ref={tabletSearchWrapRef} className="relative flex-1 min-w-0 w-full">
            <SearchPill
              inputRef={tabletSearchInputRef}
              query={query}
              setQuery={setQuery}
              onFocus={() => setSearchFocused(true)}
              onSubmit={submitSearch}
              onClear={clearSearch}
              placeholder="Search"
              buttonSize={34}
              iconSize={17}
            />
            {searchFocused && query && (
              <SuggestionsDropdown
                suggestions={suggestions}
                query={query}
                onPick={() => { setSearchFocused(false); tabletSearchInputRef.current?.blur() }}
                onSeeAll={() => submitSearch()}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile <768: hamburger | compact logo | search | account | cart ── */}
      <div className="md:hidden relative z-50">
        <div ref={mobileSearchWrapRef} className="px-3 py-2 relative z-[2] bg-canvas">
          <div className="flex items-center h-10 gap-0.5">
            {!searchFocused && (
              <>
                <button
                  type="button"
                  onClick={() => { setMobileExpandedCategory(null); setMobileOpen(true) }}
                  aria-label="Browse categories"
                  className={`w-10 h-10 shrink-0 -ml-1 flex items-center justify-center ${mobileOpen ? 'rounded-full bg-[#ececec]' : ''}`}
                >
                  <MaterialIcon name="menu" size={22} color={HEADER_ICON} />
                </button>

                <div className="shrink-0 mr-1">
                  <Logo variant="compact" />
                </div>
              </>
            )}

            <form
              onSubmit={submitSearch}
              className={`relative flex items-center h-10 border-2 border-ink rounded-full bg-white pl-3 pr-1.5 gap-1 min-w-0 ${searchFocused ? 'flex-1' : 'flex-1 mr-1'}`}
            >
              <input
                ref={mobileSearchInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="Search"
                className="flex-1 min-w-0 h-full bg-transparent text-[14px] placeholder:text-ink-soft focus:outline-none"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setSuggestions([]); mobileSearchInputRef.current?.focus() }}
                  aria-label="Clear search"
                  className="shrink-0 w-6 h-6 flex items-center justify-center text-ink-soft"
                >
                  <MaterialIcon name="close" size={18} />
                </button>
              ) : null}
              <button type="submit" aria-label="Search" className="shrink-0 w-7 h-7 rounded-full text-white flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
                <MaterialIcon name="search" size={16} />
              </button>
            </form>

            {searchFocused ? (
              <button
                type="button"
                onClick={() => { setSearchFocused(false); mobileSearchInputRef.current?.blur() }}
                className="text-[15px] font-medium text-ink shrink-0 ml-1.5"
              >
                Cancel
              </button>
            ) : (
              <>
                <button
                  type="button"
                  aria-label="Your account"
                  title="Your account"
                  onClick={() => (user ? setMobileAccountOpen(true) : requireAuth())}
                  className="w-10 h-10 shrink-0 flex items-center justify-center"
                >
                  <MaterialIcon name="person" size={22} color={HEADER_ICON} />
                </button>
                <button
                  type="button"
                  aria-label="Cart"
                  title="Cart"
                  onClick={openMobileCart}
                  className="relative w-10 h-10 shrink-0 flex items-center justify-center"
                >
                  <CartIcon size={22} color={HEADER_ICON} />
                  {cartCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full text-white text-[8px] flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
                      {cartCount}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>

          {searchFocused && query && (
            <div className="absolute left-3 right-3 top-full mt-1 bg-canvas border border-line shadow-lg z-50 max-h-[60vh] overflow-y-auto rounded-lg">
              {suggestions.length > 0 ? (
                <>
                  {suggestions.map((p) => (
                    <Link
                      key={p.id}
                      href={`/pattern/${p.slug}`}
                      onClick={() => { setSearchFocused(false); mobileSearchInputRef.current?.blur() }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-surface"
                    >
                      <div className="w-10 h-10 shrink-0 bg-surface rounded-md overflow-hidden">
                        {p.images?.[0] && <img src={deriveVariantUrl(p.images[0], 'micro')} alt={p.title} loading="lazy" className="w-full h-full object-cover" />}
                      </div>
                      <span className="text-[13px] truncate">{p.title}</span>
                      <span className="ml-auto text-[12px] text-ink-soft shrink-0">${p.price.toFixed(2)}</span>
                    </Link>
                  ))}
                  <button type="button" onClick={() => submitSearch()} className="block w-full text-left px-4 py-3 text-[12px] tracking-[0.08em] text-ink-soft hover:text-ink border-t border-line">
                    SEE ALL RESULTS FOR "{query.toUpperCase()}" →
                  </button>
                </>
              ) : (
                <p className="px-4 py-4 text-[13px] text-ink-soft">No patterns matched "{query}"</p>
              )}
            </div>
          )}
        </div>

        {/* Mobile + tablet categories panel */}
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-[1] bg-black/25 lg:hidden"
              onClick={() => { setMobileOpen(false); setMobileExpandedCategory(null) }}
            />
            <div className="absolute left-0 right-0 top-full z-[2] bg-[#faf9f5] border-b border-[#ddd] shadow-[0_12px_28px_rgba(0,0,0,0.14)] max-h-[min(78vh,640px)] overflow-y-auto lg:hidden">
              <div className="relative flex items-center justify-center px-12 pt-3.5 pb-2.5">
                <h2 className="text-[17px] font-extrabold text-black tracking-[-0.02em] leading-none">
                  Browse Categories
                </h2>
                <button
                  type="button"
                  aria-label="Close categories"
                  onClick={() => { setMobileOpen(false); setMobileExpandedCategory(null) }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-[#595959]"
                >
                  <MaterialIcon name="close" size={22} />
                </button>
              </div>
              <nav className="pb-3">
                <Link
                  href="/shop/new"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center px-5 py-3.5 text-[16px] font-extrabold text-black tracking-[-0.02em] leading-snug border-b border-[#ebe8e2]"
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
                          onClick={() => setMobileOpen(false)}
                          className="flex-1 px-5 py-3.5 text-[16px] font-extrabold text-black tracking-[-0.02em] leading-snug"
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
                              getSubcategoriesWithCounts(c.id).then((list) =>
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
                                onClick={() => setMobileOpen(false)}
                                className="block px-8 py-2.5 text-[15px] font-bold text-black tracking-[-0.015em]"
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
                <Link href="/shop" onClick={() => setMobileOpen(false)} className="flex items-center px-5 py-3.5 text-[16px] font-extrabold text-black tracking-[-0.02em] leading-snug border-b border-[#ebe8e2]">
                  All Patterns
                </Link>
                <Link href="/shop?price=free" onClick={() => setMobileOpen(false)} className="flex items-center px-5 py-3.5 text-[16px] font-extrabold text-black tracking-[-0.02em] leading-snug border-b border-[#ebe8e2]">
                  Free Patterns
                </Link>
                <Link href="/shop/sale" onClick={() => setMobileOpen(false)} className="flex items-center px-5 py-3.5 text-[16px] font-extrabold text-black tracking-[-0.02em] leading-snug">
                  Sale
                </Link>
              </nav>
            </div>
          </>
        )}
      </div>

      {mobileAccountOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
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
                    {(profile?.first_name?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium truncate">{[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'My Account'}</p>
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
                  className="px-6 py-3 rounded-lg text-white text-[13px] font-semibold"
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
  profile: { first_name?: string | null; last_name?: string | null } | null
  requireAuth: () => boolean
  signOut: () => void
}) {
  if (!user) {
    return (
      <button
        type="button"
        onClick={() => { requireAuth() }}
        className="h-10 px-2.5 text-[13px] font-medium text-ink hover:opacity-70 transition-opacity whitespace-nowrap shrink-0"
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
  profile: { first_name?: string | null; last_name?: string | null } | null
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
            {(profile?.first_name?.[0] ?? email?.[0] ?? '?').toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-ink truncate">
              {[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'My Account'}
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
