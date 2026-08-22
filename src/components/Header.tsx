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
const SKILL_LEVELS: { key: 'beginner' | 'intermediate' | 'advanced'; label: string; icon: string }[] = [
  { key: 'beginner', label: 'Beginner Friendly', icon: 'health_and_safety' },
  { key: 'intermediate', label: 'Intermediate', icon: 'trending_up' },
  { key: 'advanced', label: 'Advanced', icon: 'military_tech' },
]

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="Notion Creative Art — home">
      <div className="w-9 h-9 border-[1.5px] border-ink rounded-lg flex items-center justify-center shrink-0">
        <span className="font-display text-[11px] font-medium tracking-tight">NCA</span>
      </div>
      <span className="font-display text-[15px] font-semibold tracking-wide leading-none">Notion Creative Art</span>
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
  const [megaCategory, setMegaCategory] = useState<CategoryWithCount | null>(null)
  const [megaProducts, setMegaProducts] = useState<Product[]>([])
  const [megaProductIndex, setMegaProductIndex] = useState(0)
  const [megaSubcategories, setMegaSubcategories] = useState<SubcategoryWithCount[]>([])
  const [mobileExpandedCategory, setMobileExpandedCategory] = useState<string | null>(null)
  const [mobileSubcategoriesCache, setMobileSubcategoriesCache] = useState<Record<string, SubcategoryWithCount[]>>({})
  const [skillCounts, setSkillCounts] = useState<Record<string, number>>({})
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
    if (!categoriesOpen || categories.length === 0) return
    setMegaCategory((cur) => cur ?? categories[0])
    if (Object.keys(skillCounts).length > 0) return
    Promise.all(
      SKILL_LEVELS.map(({ key }) =>
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('active', true).eq('skill_level', key).then(({ count }) => [key, count ?? 0] as const)
      )
    ).then((entries) => setSkillCounts(Object.fromEntries(entries)))
  }, [categoriesOpen, categories])

  useEffect(() => {
    if (!megaCategory) return
    setMegaProductIndex(0)
    supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .eq('category_id', megaCategory.id)
      .order('featured', { ascending: false })
      .order('wishlist_count', { ascending: false })
      .limit(4)
      .then(({ data }) => setMegaProducts((data as Product[]) ?? []))
    getSubcategoriesWithCounts(megaCategory.id).then(setMegaSubcategories)
  }, [megaCategory])

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
        <div className="flex items-center flex-1 min-w-0 border border-line rounded-full bg-canvas focus-within:ring-2 focus-within:ring-ink">
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
                <div
                  className="absolute left-0 top-full mt-3 bg-canvas border border-line shadow-lg z-50 flex"
                  style={{ width: megaSubcategories.length > 0 ? 'min(1140px, calc(100vw - 48px))' : 'min(880px, calc(100vw - 48px))' }}
                >
                  <div className="w-[220px] shrink-0 border-r border-line py-3">
                    {categories.map((c) => (
                      <button
                        key={c.link}
                        onMouseEnter={() => setMegaCategory(c)}
                        onClick={() => { setCategoriesOpen(false); router.push(c.link) }}
                        className={`w-full flex items-center gap-3 px-5 py-2.5 text-[13px] text-left transition-colors ${megaCategory?.link === c.link ? 'bg-surface text-ink' : 'text-ink-soft hover:bg-surface hover:text-ink'}`}
                      >
                        <MaterialIcon name={categoryIcon(c.name)} size={18} />
                        {c.name}
                        <MaterialIcon name="chevron_right" size={16} className="ml-auto opacity-50" />
                      </button>
                    ))}
                    <div className="px-5 pt-2 mt-2 border-t border-line">
                      <Link href="/shop" onClick={() => setCategoriesOpen(false)} className="flex items-center gap-2 text-[12px] font-medium text-ink hover:opacity-70">
                        <MaterialIcon name="grid_view" size={16} /> View All Categories
                      </Link>
                    </div>
                  </div>

                  {megaCategory && (
                    <div className={`flex-1 grid gap-6 p-6 ${megaSubcategories.length > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                      {megaSubcategories.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-[11px] tracking-[0.15em] text-ink-soft font-semibold">
                              {megaCategory.name.toUpperCase()} CATEGORIES
                            </p>
                            <Link href={megaCategory.link} onClick={() => setCategoriesOpen(false)} className="text-[11px] text-ink-soft hover:text-ink whitespace-nowrap">
                              View All →
                            </Link>
                          </div>
                          <div className="space-y-1">
                            {megaSubcategories.map((sub) => (
                              <Link
                                key={sub.id}
                                href={`/shop/${sub.slug}`}
                                onClick={() => setCategoriesOpen(false)}
                                className="flex items-center gap-3 px-2 py-2 rounded-lg text-[13px] text-ink-soft hover:bg-surface hover:text-ink transition-colors"
                              >
                                {sub.image ? (
                                  <img src={sub.image} alt={sub.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-surface shrink-0" />
                                )}
                                <span className="flex-1">{sub.name}</span>
                                <span className="text-[11px] text-ink-soft/70">{sub.count}+ Patterns</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[11px] tracking-[0.15em] text-ink-soft font-semibold">
                            POPULAR IN {megaCategory.name.toUpperCase()}
                          </p>
                          <Link href={megaCategory.link} onClick={() => setCategoriesOpen(false)} className="text-[11px] text-ink-soft hover:text-ink whitespace-nowrap">
                            View All →
                          </Link>
                        </div>
                        {megaProducts.length > 0 ? (
                          <>
                            <Link href={`/pattern/${megaProducts[megaProductIndex].slug}`} onClick={() => setCategoriesOpen(false)} className="group block">
                              <div className="aspect-square bg-surface rounded-lg overflow-hidden mb-2">
                                {megaProducts[megaProductIndex].images?.[0] && (
                                  <img src={deriveVariantUrl(megaProducts[megaProductIndex].images[0], 'thumb')} alt={megaProducts[megaProductIndex].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                )}
                              </div>
                              <p className="text-[13px] group-hover:underline underline-offset-2">{megaProducts[megaProductIndex].title}</p>
                              <p className="text-[13px] mt-0.5">
                                <span className="text-ink font-semibold">${megaProducts[megaProductIndex].price.toFixed(2)}</span>
                                {megaProducts[megaProductIndex].compare_at_price && (
                                  <span className="line-through text-ink-soft ml-2 text-[12px]">${megaProducts[megaProductIndex].compare_at_price!.toFixed(2)}</span>
                                )}
                              </p>
                            </Link>
                            {megaProducts.length > 1 && (
                              <div className="flex gap-1.5 mt-3">
                                {megaProducts.map((_, i) => (
                                  <button key={i} onClick={() => setMegaProductIndex(i)} aria-label={`Show product ${i + 1}`} className={`w-1.5 h-1.5 rounded-full ${i === megaProductIndex ? 'bg-ink' : 'bg-ink/25'}`} />
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-[12px] text-ink-soft">No patterns in this category yet.</p>
                        )}
                        <div className="mt-5 pt-4 border-t border-line">
                          <p className="text-[12px] font-medium mb-2">Looking for something specific?</p>
                          <form
                            onSubmit={(e) => { e.preventDefault(); setCategoriesOpen(false); if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`) }}
                            className="relative"
                          >
                            <input
                              value={query}
                              onChange={(e) => setQuery(e.target.value)}
                              placeholder="Search patterns..."
                              className="w-full border border-line rounded-lg pl-3 pr-9 py-2 text-[12px] bg-canvas focus:outline-none focus:border-ink"
                            />
                            <button type="submit" aria-label="Search" className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-soft">
                              <MaterialIcon name="search" size={16} />
                            </button>
                          </form>
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] tracking-[0.15em] text-ink-soft font-semibold mb-3">SHOP BY SKILL LEVEL</p>
                        <div className="space-y-1">
                          {SKILL_LEVELS.map((s) => (
                            <Link
                              key={s.key}
                              href={`/shop?level=${s.key}`}
                              onClick={() => setCategoriesOpen(false)}
                              className="flex items-center gap-3 px-2 py-2 rounded-lg text-[13px] text-ink-soft hover:bg-surface hover:text-ink transition-colors"
                            >
                              <MaterialIcon name={s.icon} size={18} />
                              <span>
                                {s.label}
                                <span className="block text-[11px] text-ink-soft">{skillCounts[s.key] ?? 0}+ Patterns</span>
                              </span>
                            </Link>
                          ))}
                        </div>
                        <Link href="/shop?bundle=1" onClick={() => setCategoriesOpen(false)} className="block mt-4 rounded-lg overflow-hidden border border-line hover:opacity-90 transition-opacity">
                          <div className="px-4 py-4" style={{ background: 'var(--color-surface)' }}>
                            <p className="text-[12px] font-semibold mb-0.5">Save More With Bundles</p>
                            <p className="text-[11px] text-ink-soft mb-2">Curated pattern bundles at the best prices!</p>
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink">
                              Shop Bundles <MaterialIcon name="arrow_forward" size={14} />
                            </span>
                          </div>
                        </Link>
                      </div>
                    </div>
                  )}
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
            onClick={() => requireAuth() && (window.location.href = '/wishlist')}
            className="flex items-center gap-1.5 text-ink-soft hover:text-ink transition-colors"
          >
            <HeartIcon size={20} />
            <span className="text-[13px]">Wishlist</span>
          </button>
          {user ? (
            <div ref={desktopAccountWrapRef} className="relative">
              <button
                onClick={() => setDesktopAccountOpen((v) => !v)}
                className="flex items-center gap-1.5 text-ink-soft hover:text-ink transition-colors"
                aria-label="Account"
                aria-expanded={desktopAccountOpen}
              >
                <UserIcon size={20} />
                <span className="text-[13px]">Account</span>
                <ChevronIcon open={desktopAccountOpen} />
              </button>
              {desktopAccountOpen && (
                <div className="absolute right-0 top-full pt-3 z-50">
                  <div className="w-48 bg-canvas border border-line shadow-lg text-sm rounded-lg overflow-hidden">
                    <div className="px-5 py-3 border-b border-line text-ink-soft text-[11px] tracking-wide">
                      {profile?.first_name || 'MY ACCOUNT'}
                    </div>
                    <Link href="/account" onClick={() => setDesktopAccountOpen(false)} className="block px-5 py-3 hover:bg-surface text-[13px]">Dashboard</Link>
                    <Link href="/account/orders" onClick={() => setDesktopAccountOpen(false)} className="block px-5 py-3 hover:bg-surface text-[13px]">Orders</Link>
                    <Link href="/account/downloads" onClick={() => setDesktopAccountOpen(false)} className="block px-5 py-3 hover:bg-surface text-[13px] lg:hidden">My Downloads</Link>
                    <Link href="/wishlist" onClick={() => setDesktopAccountOpen(false)} className="block px-5 py-3 hover:bg-surface text-[13px]">Wishlist</Link>
                    <Link href="/account/profile" onClick={() => setDesktopAccountOpen(false)} className="block px-5 py-3 hover:bg-surface text-[13px]">Profile</Link>
                    <button onClick={() => { signOut(); setDesktopAccountOpen(false) }} className="w-full text-left px-5 py-3 hover:bg-surface text-[13px] text-ink border-t border-line">Logout</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => requireAuth()}
              className="flex items-center gap-1.5 text-ink-soft hover:text-ink transition-colors"
            >
              <UserIcon size={20} />
              <span className="text-[13px]">Account</span>
            </button>
          )}
          <button
            onClick={openDrawer}
            aria-label="Cart"
            className="relative flex items-center gap-1.5 text-ink-soft hover:text-ink transition-colors"
          >
            <CartIcon size={20} />
            <span className="text-[13px]">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-sale-green text-white text-[9px] flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile row — V2: logo left, icon row right, prominent search bar below */}
      <div className="flex md:hidden items-center justify-between px-4 h-[58px]">
        <Link href="/" className="flex items-center gap-1.5 shrink-0" aria-label="Notion Creative Art — home">
          <div className="w-8 h-8 border-[1.5px] border-ink rounded-lg flex items-center justify-center shrink-0">
            <span className="font-display text-[10px] font-medium">NCA</span>
          </div>
        </Link>

        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setMobileOpen(true)} aria-label="Categories" className="w-10 h-10 flex items-center justify-center text-ink">
            <MaterialIcon name="grid_view" size={19} />
          </button>
          <button
            aria-label="Wishlist"
            onClick={() => requireAuth() && (window.location.href = '/wishlist')}
            className="w-10 h-10 flex items-center justify-center text-ink"
          >
            <HeartIcon size={19} />
          </button>
          <button
            aria-label="Account"
            onClick={() => (user ? setMobileAccountOpen(true) : requireAuth())}
            className="w-10 h-10 flex items-center justify-center text-ink"
          >
            <UserIcon size={19} />
          </button>
          <button onClick={openDrawer} aria-label="Cart" className="relative w-10 h-10 flex items-center justify-center text-ink">
            <CartIcon size={19} />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-sale-green text-white text-[9px] flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
      <div ref={mobileSearchWrapRef} className="md:hidden px-4 pb-3 relative">
        <form onSubmit={submitSearch} className="flex items-center gap-2.5">
          <div className="relative flex-1">
            {!searchFocused && (
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none">
                <SearchIcon />
              </span>
            )}
            <input
              ref={mobileSearchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Search patterns, categories..."
              className={`w-full border border-line rounded-full py-2.5 text-[13px] bg-canvas placeholder:text-ink-soft focus:outline-none ${searchFocused ? 'pl-4' : 'pl-10'} pr-11`}
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setSuggestions([]) }}
                aria-label="Clear search"
                className="absolute right-11 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-ink-soft"
              >
                <MaterialIcon name="close" size={14} />
              </button>
            )}
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-sale-green text-white flex items-center justify-center hover:opacity-85 transition-opacity"
            >
              <MaterialIcon name="search" size={16} />
            </button>
          </div>
          {searchFocused && (
            <button
              type="button"
              onClick={() => { setSearchFocused(false); setQuery(''); setSuggestions([]); mobileSearchInputRef.current?.blur() }}
              className="text-[13px] text-ink-soft shrink-0"
            >
              Cancel
            </button>
          )}
        </form>

        {searchFocused && query && (
          <div className="absolute left-4 right-4 top-full mt-2 bg-canvas border border-line shadow-lg z-50 max-h-[60vh] overflow-y-auto rounded-lg">
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
              <button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="text-ink text-xl leading-none">✕</button>
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
              <button aria-label="Close menu" onClick={() => setMobileAccountOpen(false)} className="text-ink text-xl leading-none">✕</button>
            </div>

            {user ? (
              <>
                <div className="px-6 py-5 border-b border-line flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white font-semibold" style={{ background: 'var(--color-primary)' }}>
                    {(profile?.first_name?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium truncate">{[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'My Account'}</p>
                    <p className="text-[12px] text-ink-soft truncate">{user.email}</p>
                  </div>
                </div>
                <nav className="flex flex-col py-2 overflow-y-auto flex-1 pb-20">
                  <Link href="/account" onClick={() => setMobileAccountOpen(false)} className="flex items-center gap-3 px-6 py-3.5 text-[13px] text-ink">
                    <UserIcon size={18} /> My Account
                  </Link>
                  <Link href="/account/orders" onClick={() => setMobileAccountOpen(false)} className="flex items-center gap-3 px-6 py-3.5 text-[13px] text-ink">
                    <MaterialIcon name="receipt_long" size={18} /> My Purchases
                  </Link>
                  <Link href="/account/downloads" onClick={() => setMobileAccountOpen(false)} className="flex items-center gap-3 px-6 py-3.5 text-[13px] text-ink">
                    <MaterialIcon name="download" size={18} /> My Downloads
                  </Link>
                  <Link href="/wishlist" onClick={() => setMobileAccountOpen(false)} className="flex items-center gap-3 px-6 py-3.5 text-[13px] text-ink">
                    <HeartIcon size={18} /> Wishlist
                  </Link>
                  <div className="border-t border-line mt-2 pt-2">
                    <Link href="/account/profile" onClick={() => setMobileAccountOpen(false)} className="flex items-center gap-3 px-6 py-3.5 text-[13px] text-ink">
                      <MaterialIcon name="settings" size={18} /> Account Settings
                    </Link>
                    <Link href="/faq" onClick={() => setMobileAccountOpen(false)} className="flex items-center gap-3 px-6 py-3.5 text-[13px] text-ink">
                      <MaterialIcon name="help" size={18} /> Help &amp; Support
                    </Link>
                  </div>
                  <div className="border-t border-line mt-2 pt-2">
                    <button
                      onClick={() => { signOut(); setMobileAccountOpen(false) }}
                      className="w-full flex items-center gap-3 px-6 py-3.5 text-[13px] text-ink"
                    >
                      <MaterialIcon name="logout" size={18} /> Sign Out
                    </button>
                  </div>
                </nav>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
                <UserIcon size={36} />
                <p className="text-[14px] text-ink-soft">Sign in to see your account, orders and downloads.</p>
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
function CartIcon({ size = 22 }: { size?: number }) {
  return <MaterialIcon name="shopping_bag" size={size} />
}
function HeartIcon({ size = 22 }: { size?: number }) {
  return <MaterialIcon name="favorite" size={size} />
}
function UserIcon({ size = 22 }: { size?: number }) {
  return <MaterialIcon name="person" size={size} />
}
