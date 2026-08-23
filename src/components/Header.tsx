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
import { PersonIcon, FavoriteIcon, SettingsIcon, DownloadCircleIcon, CloseCircleIcon, OrderIcon, ShoppingBagIcon, UI_ICON_SIZE } from './icons'

const CATEGORY_ICONS: Record<string, string> = {
  amigurumi: 'toys',
  wearables: 'checkroom',
  'baby & kids': 'child_care',
  'home decor': 'cottage',
  accessories: 'shopping_bag',
  'seasonal & holiday': 'park',
  seasonal: 'park',
  bundles: 'inventory_2',
  'tools & guides': 'construction',
}
function categoryIcon(name: string) {
  return CATEGORY_ICONS[name.toLowerCase()] ?? 'category'
}

const LOGO_BLUE = '#0f3fc9'

/** Desktop: large blue NCA + stacked NOTION / CREATIVE / ART. Mobile: blue NCA only. */
function Logo({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  if (variant === 'mobile') {
    return (
      <Link href="/" className="shrink-0 leading-none" aria-label="Notion Creative Art — home">
        <span
          className="font-display font-extrabold tracking-tight text-[26px]"
          style={{ color: LOGO_BLUE }}
        >
          NCA
        </span>
      </Link>
    )
  }

  return (
    <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Notion Creative Art — home">
      <span
        className="font-display font-extrabold tracking-tight text-[34px] xl:text-[38px] leading-none"
        style={{ color: LOGO_BLUE }}
      >
        NCA
      </span>
      <span className="flex flex-col justify-center leading-[1.05] text-[10px] xl:text-[11px] font-semibold tracking-[0.06em] uppercase text-ink">
        <span>Notion</span>
        <span>Creative</span>
        <span>Art</span>
      </span>
    </Link>
  )
}

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
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [mobileExpandedCategory, setMobileExpandedCategory] = useState<string | null>(null)
  const [mobileSubcategoriesCache, setMobileSubcategoriesCache] = useState<Record<string, SubcategoryWithCount[]>>({})
  const [messages, setMessages] = useState<string[]>(['FREE PATTERN WITH EVERY FIRST ORDER — CODE FIRSTSTITCH'])
  const [messageIndex, setMessageIndex] = useState(0)

  // Search
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [searchFocused, setSearchFocused] = useState(false)
  const searchWrapRef = useRef<HTMLDivElement>(null)
  const mobileSearchWrapRef = useRef<HTMLDivElement>(null)
  const desktopSearchInputRef = useRef<HTMLInputElement>(null)
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
      const insideDesktopSearch = searchWrapRef.current?.contains(e.target as Node) ?? false
      const insideMobileSearch = mobileSearchWrapRef.current?.contains(e.target as Node) ?? false
      if (!insideDesktopSearch && !insideMobileSearch) setSearchFocused(false)
      if (desktopAccountWrapRef.current && !desktopAccountWrapRef.current.contains(e.target as Node)) setDesktopAccountOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // Keep the header search input showing whatever's actually being searched —
  // otherwise a fresh load, shared link, or back/forward nav to /search?q=X
  // left the bar looking empty while the results below were for a real query.
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
    mobileSearchInputRef.current?.blur()
    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="sticky top-0 z-40 bg-canvas border-b border-line">
      <div
        className="hidden md:flex items-center justify-between text-white text-[11px] tracking-[0.04em] px-6 lg:px-10 py-2 max-w-[1400px] mx-auto"
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

      {/* Main row — logo, separate Categories button, dominant search bar, labeled icons */}
      <div className="hidden md:flex items-center gap-4 lg:gap-6 px-4 lg:px-8 py-4 max-w-[1400px] mx-auto">
        <div className="flex items-center min-w-0 shrink-0">
          <Logo />
        </div>

        {/* Categories + Search — merged into a single unified control on desktop, Amazon/Etsy-style */}
        <div className="flex items-center flex-1 min-w-0 border-2 border-ink rounded-full bg-canvas focus-within:ring-2 focus-within:ring-ink">
          <div className="relative shrink-0">
            <button
              onClick={() => setCategoriesOpen((v) => !v)}
              aria-label="Browse categories"
              className="flex items-center gap-1.5 pl-4 pr-3 lg:pl-5 lg:pr-4 py-3 rounded-l-full text-[13px] text-ink hover:bg-surface transition-colors whitespace-nowrap"
            >
              <MaterialIcon name="menu" size={16} />
              <span className="hidden lg:inline">Categories</span>
              <ChevronIcon open={categoriesOpen} />
            </button>

            {categoriesOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setCategoriesOpen(false)} />
                <div className="absolute left-0 top-full mt-2 z-50 w-[280px]">
                  <div className="bg-white border border-line rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-hidden">
                    <div className="max-h-[min(420px,70vh)] overflow-y-auto py-1.5" style={{ scrollbarWidth: 'thin' }}>
                      <Link
                        href="/shop"
                        onClick={() => setCategoriesOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-ink hover:bg-surface transition-colors"
                      >
                        <MaterialIcon name="auto_awesome" size={16} color="#e67a2e" />
                        Recommended categories
                      </Link>
                      <div className="mx-4 mb-1.5 border-b" style={{ borderColor: LOGO_BLUE }} />
                      {categories.map((c) => (
                        <Link
                          key={c.link}
                          href={c.link}
                          onClick={() => setCategoriesOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-ink hover:bg-surface transition-colors"
                        >
                          <span className="flex-1 truncate">{c.name}</span>
                          <MaterialIcon name="chevron_right" size={16} className="text-ink-soft shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="w-px self-stretch my-2.5 bg-line shrink-0" />

          {/* Search — same visual control, no border/rounding of its own now */}
          <div ref={searchWrapRef} className="relative flex-1 min-w-0">
            <form onSubmit={submitSearch} className="relative">
              <input
                ref={desktopSearchInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="Search patterns, categories..."
                className="w-full bg-transparent pl-4 pr-12 py-3 text-[14px] placeholder:text-ink-soft focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setSuggestions([])
                    if (pathname === '/search') router.push('/search')
                  }}
                  aria-label="Clear search"
                  className="absolute right-12 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-ink-soft hover:text-ink"
                >
                  ✕
                </button>
              )}
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-sale-green text-white flex items-center justify-center hover:opacity-85 transition-opacity"
              >
                <SearchIcon />
              </button>
            </form>

            {searchFocused && query && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-canvas border border-line shadow-lg z-50 max-h-96 overflow-y-auto rounded-lg">
                {suggestions.length > 0 ? (
                  <>
                    {suggestions.map((p) => (
                      <Link
                        key={p.id}
                        href={`/pattern/${p.slug}`}
                        onClick={() => { setSearchFocused(false); desktopSearchInputRef.current?.blur() }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-surface"
                      >
                        <div className="w-10 h-10 shrink-0 bg-surface rounded-md overflow-hidden">
                          {p.images?.[0] && <img src={deriveVariantUrl(p.images[0], 'micro')} alt={p.title} loading="lazy" className="w-full h-full object-cover" />}
                        </div>
                        <span className="text-[13px] truncate">{p.title}</span>
                        <span className="ml-auto text-[12px] text-ink-soft shrink-0">${p.price.toFixed(2)}</span>
                      </Link>
                    ))}
                    <button onClick={() => submitSearch()} className="block w-full text-left px-4 py-3 text-[12px] tracking-[0.08em] text-ink-soft hover:text-ink border-t border-line">
                      SEE ALL RESULTS FOR "{query.toUpperCase()}" →
                    </button>
                  </>
                ) : (
                  <p className="px-4 py-4 text-[13px] text-ink-soft">No patterns matched "{query}"</p>
                )}
              </div>
            )}
          </div>
        </div>

        {pathname === '/search' && (
          <button
            onClick={() => { setQuery(''); setSuggestions([]); router.push('/'); desktopSearchInputRef.current?.blur() }}
            className="text-[13px] text-ink-soft hover:text-ink shrink-0"
          >
            Cancel
          </button>
        )}

        {/* Right: labeled icons — Wishlist, Account, Cart in that order */}
        <div className="flex items-center gap-5 shrink-0">
          <button
            aria-label="Wishlist"
            onClick={() => requireAuth() && (window.location.href = '/account/wishlist')}
            className="flex items-center gap-1.5 text-ink-soft hover:text-ink transition-colors"
          >
            <HeartIcon size={UI_ICON_SIZE} />
            <span className="text-[13px]">Wishlist</span>
          </button>
          <div ref={desktopAccountWrapRef} className="relative">
            <button
              onClick={() => (user ? setDesktopAccountOpen((v) => !v) : requireAuth())}
              className="flex items-center gap-1.5 text-ink-soft hover:text-ink transition-colors"
              aria-label="Account"
              aria-expanded={desktopAccountOpen}
            >
              <UserIcon size={UI_ICON_SIZE} />
              <span className="text-[13px]">Account</span>
              {user && <ChevronIcon open={desktopAccountOpen} />}
            </button>
            {user && desktopAccountOpen && (
              <div className="absolute right-0 top-full pt-2 z-50">
                <div className="w-[260px] bg-white border border-line shadow-[0_8px_30px_rgba(0,0,0,0.12)] text-sm rounded-xl overflow-hidden">
                  <div className="h-1" style={{ background: 'var(--color-accent)' }} />
                  <div className="flex items-center gap-3 px-4 py-3.5 border-b border-line" style={{ background: 'var(--color-surface)' }}>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-[14px] font-semibold"
                      style={{ background: 'var(--color-accent)' }}
                    >
                      {(profile?.first_name?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-ink truncate">
                        {[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'My Account'}
                      </p>
                      <p className="text-[11px] text-ink-soft truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="py-1.5">
                    <Link href="/account/orders" onClick={() => setDesktopAccountOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface text-[13px] text-ink">
                      <OrderIcon size={UI_ICON_SIZE} /> Orders
                    </Link>
                    <Link href="/account/downloads" onClick={() => setDesktopAccountOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface text-[13px] text-ink">
                      <DownloadCircleIcon size={UI_ICON_SIZE} /> Downloads
                    </Link>
                  </div>
                  <div className="border-t border-line py-1.5">
                    <Link href="/account/profile" onClick={() => setDesktopAccountOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface text-[13px] text-ink">
                      <SettingsIcon size={UI_ICON_SIZE} /> Account settings
                    </Link>
                    <button
                      onClick={() => { signOut(); setDesktopAccountOpen(false) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface text-[13px] text-ink text-left"
                    >
                      <MaterialIcon name="logout" size={18} /> Sign out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={openDrawer}
            aria-label="Cart"
            className="relative flex items-center gap-1.5 text-ink-soft hover:text-ink transition-colors"
          >
            <CartIcon size={UI_ICON_SIZE} />
            <span className="text-[13px]">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-sale-green text-white text-[9px] flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile header — Etsy-style single row: menu | logo | search | account | cart */}
      <div ref={mobileSearchWrapRef} className="md:hidden px-3 py-2.5 relative">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Browse categories"
            className="w-9 h-9 shrink-0 flex items-center justify-center text-ink"
          >
            <MaterialIcon name="menu" size={22} />
          </button>

          <div className="shrink-0">
            <Logo variant="mobile" />
          </div>

          <form onSubmit={submitSearch} className="relative flex-1 min-w-0">
            <div className="relative flex items-center border-2 border-ink rounded-full bg-canvas overflow-hidden h-9">
              <input
                ref={mobileSearchInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="Search"
                className="w-full bg-transparent pl-3 pr-10 py-1.5 text-[13px] placeholder:text-ink-soft focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-0.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-sale-green text-white flex items-center justify-center hover:opacity-85 transition-opacity"
              >
                <MaterialIcon name="search" size={15} />
              </button>
            </div>
          </form>

          <button
            aria-label="Account"
            onClick={() => (user ? setMobileAccountOpen(true) : requireAuth())}
            className="w-9 h-9 shrink-0 flex items-center justify-center text-ink"
          >
            <UserIcon size={UI_ICON_SIZE} />
          </button>
          <button onClick={openDrawer} aria-label="Cart" className="relative w-9 h-9 shrink-0 flex items-center justify-center text-ink">
            <CartIcon size={UI_ICON_SIZE} />
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-sale-green text-white text-[8px] flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
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
                <button onClick={() => submitSearch()} className="block w-full text-left px-4 py-3 text-[12px] tracking-[0.08em] text-ink-soft hover:text-ink border-t border-line">
                  SEE ALL RESULTS FOR "{query.toUpperCase()}" →
                </button>
              </>
            ) : (
              <p className="px-4 py-4 text-[13px] text-ink-soft">No patterns matched "{query}"</p>
            )}
          </div>
        )}
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-canvas flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-line">
              <span className="font-subheading text-lg">Categories</span>
              <button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="p-1">
                <CloseCircleIcon size={28} />
              </button>
            </div>
            <nav className="flex flex-col py-2 overflow-y-auto flex-1 pb-20">
              <Link href="/shop" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-6 py-3.5 text-[13px] text-ink">
                <MaterialIcon name="grid_view" size={18} /> All Patterns
              </Link>
              <Link href="/shop/new" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-6 py-3.5 text-[13px] text-ink">
                <MaterialIcon name="star" size={18} /> New Arrivals
              </Link>
              <Link href="/shop/bestsellers" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-6 py-3.5 text-[13px] text-ink">
                <MaterialIcon name="star" size={18} /> Featured Items
              </Link>
              <Link href="/shop?price=free" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-6 py-3.5 text-[13px] text-ink">
                <MaterialIcon name="card_giftcard" size={18} color="var(--color-primary)" /> Free Patterns
              </Link>

              <div className="border-t border-line mt-2 pt-2">
                {categories.map((c) => (
                  <div key={c.link}>
                    <div className="flex items-center">
                      <Link href={c.link} onClick={() => setMobileOpen(false)} className="flex-1 flex items-center gap-3 pl-6 pr-3 py-3.5 text-[13px] text-ink">
                        <MaterialIcon name={categoryIcon(c.name)} size={18} />
                        {c.name}
                      </Link>
                      <button
                        aria-label={`Show ${c.name} subcategories`}
                        onClick={() => {
                          const opening = mobileExpandedCategory !== c.id
                          setMobileExpandedCategory(opening ? c.id : null)
                          if (opening && !mobileSubcategoriesCache[c.id]) {
                            getSubcategoriesWithCounts(c.id).then((subs) => setMobileSubcategoriesCache((prev) => ({ ...prev, [c.id]: subs })))
                          }
                        }}
                        className="px-4 py-3.5 text-ink-soft"
                      >
                        <MaterialIcon name="chevron_right" size={16} style={{ transform: mobileExpandedCategory === c.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                      </button>
                    </div>
                    {mobileExpandedCategory === c.id && (mobileSubcategoriesCache[c.id]?.length ?? 0) > 0 && (
                      <div className="pb-1">
                        {mobileSubcategoriesCache[c.id].map((sub) => (
                          <Link key={sub.id} href={`/shop/${sub.slug}`} onClick={() => setMobileOpen(false)} className="block pl-16 pr-6 py-2 text-[12px] text-ink-soft">
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-line mt-2 pt-2">
                <Link href="/shop/sale" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-6 py-3.5 text-[13px] text-ink">
                  <MaterialIcon name="sell" size={18} /> Sale
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}

      {mobileAccountOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-canvas flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-line">
              <span className="font-subheading text-lg">{user ? 'My Account' : 'Account'}</span>
              <button aria-label="Close menu" onClick={() => setMobileAccountOpen(false)} className="p-1">
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
                  <div className="border-t border-line mt-2 pt-2">
                    <Link href="/account/profile" onClick={() => setMobileAccountOpen(false)} className="flex items-center gap-3 px-6 py-3.5 text-[13px] text-ink">
                      <SettingsIcon size={UI_ICON_SIZE} /> Account settings
                    </Link>
                  </div>
                  <div className="border-t border-line mt-2 pt-2">
                    <button
                      onClick={() => { signOut(); setMobileAccountOpen(false) }}
                      className="w-full flex items-center gap-3 px-6 py-3.5 text-[13px] text-ink"
                    >
                      <MaterialIcon name="logout" size={18} /> Sign out
                    </button>
                  </div>
                </nav>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
                <UserIcon size={36} />
                <p className="text-[14px] text-ink-soft">Sign in to see your orders and downloads.</p>
                <button
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

function ChevronIcon({ open }: { open: boolean }) {
  return <MaterialIcon name="expand_more" size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
}
function SearchIcon() {
  return <MaterialIcon name="search" size={20} />
}
function CartIcon({ size = UI_ICON_SIZE }: { size?: number }) {
  return <ShoppingBagIcon size={size} />
}
function HeartIcon({ size = UI_ICON_SIZE }: { size?: number }) {
  return <FavoriteIcon size={size} />
}
function UserIcon({ size = UI_ICON_SIZE }: { size?: number }) {
  return <PersonIcon size={size} />
}
