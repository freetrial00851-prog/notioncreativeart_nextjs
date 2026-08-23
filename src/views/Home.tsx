'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { getCategoriesWithProducts, type CategoryWithCount } from '../lib/categories'
import { DEFAULT_LAYOUT, mergeLayout } from '../lib/defaultLayout'
import type { Product, HeroContent, ChapterContent, LayoutSection, TestimonialContent } from '../lib/types'
import { ProductCard } from '../components/ProductCard'
import { MaterialIcon } from '../components/MaterialIcon'
import { NewsletterBanner } from '../components/NewsletterBanner'
import { HomeSectionSkeleton } from '../components/Skeleton'

function HeroCollage({ group, className = 'h-[280px] md:h-full' }: { group: string[]; className?: string }) {
  if (group.length >= 3) {
    return (
      <div className={`grid grid-cols-[1.5fr_1fr] gap-3 ${className}`}>
        <div className="rounded-[18px] overflow-hidden bg-surface">
          <img src={group[0]} alt="" loading="eager" fetchPriority="high" className="w-full h-full object-cover" />
        </div>
        <div className="grid grid-rows-2 gap-3">
          <div className="rounded-[18px] overflow-hidden bg-surface">
            <img src={group[1]} alt="" loading="lazy" className="w-full h-full object-cover" />
          </div>
          <div className="rounded-[18px] overflow-hidden bg-surface">
            <img src={group[2]} alt="" loading="lazy" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    )
  }
  if (group.length === 2) {
    return (
      <div className={`grid grid-cols-2 gap-3 ${className}`}>
        <div className="rounded-[18px] overflow-hidden bg-surface">
          <img src={group[0]} alt="" loading="eager" fetchPriority="high" className="w-full h-full object-cover" />
        </div>
        <div className="rounded-[18px] overflow-hidden bg-surface">
          <img src={group[1]} alt="" loading="lazy" className="w-full h-full object-cover" />
        </div>
      </div>
    )
  }
  return (
    <div className={`relative rounded-[18px] overflow-hidden bg-surface ${className}`}>
      <img src={group[0]} alt="" loading="eager" fetchPriority="high" className="absolute inset-0 w-full h-full object-cover" />
    </div>
  )
}

export function Home() {
const [trending, setTrending] = useState<Product[]>([])
  const [newArrivals, setNewArrivals] = useState<Product[]>([])
  const [bundles, setBundles] = useState<Product[]>([])
  const [freeProduct, setFreeProduct] = useState<Product | null>(null)
  const [hero, setHero] = useState<HeroContent | null>(null)
  const [heroReady, setHeroReady] = useState(false)
  const [heroSlide, setHeroSlide] = useState(0)
  const [chapters, setChapters] = useState<ChapterContent[]>([])
  const [testimonials, setTestimonials] = useState<TestimonialContent[]>([])
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [layout, setLayout] = useState<LayoutSection[]>(DEFAULT_LAYOUT)
  const [skillCounts, setSkillCounts] = useState<Record<'beginner' | 'intermediate' | 'advanced', number>>({ beginner: 0, intermediate: 0, advanced: 0 })
  const [activeSkill, setActiveSkill] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [skillProducts, setSkillProducts] = useState<Product[]>([])
  const [skillLoading, setSkillLoading] = useState(true)
  const [testimonialPage, setTestimonialPage] = useState(0)
  const categoryScrollRef = useRef<HTMLDivElement>(null)

  const HERO_GROUP_SIZE = 3
  const heroImages = hero?.images ?? []
  const heroGroups = heroImages.length > 0
    ? Array.from({ length: Math.ceil(heroImages.length / HERO_GROUP_SIZE) }, (_, i) => heroImages.slice(i * HERO_GROUP_SIZE, i * HERO_GROUP_SIZE + HERO_GROUP_SIZE))
    : []
  const currentHeroGroup = heroGroups[Math.min(heroSlide, Math.max(heroGroups.length - 1, 0))] ?? []

  useEffect(() => {
    if (heroGroups.length <= 1) return
    const timer = setInterval(() => setHeroSlide((i) => (i + 1) % heroGroups.length), 5000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroGroups.length])

  useEffect(() => {
    supabase.from('products').select('*').eq('active', true).eq('featured', true).order('created_at', { ascending: false }).limit(6)
      .then(({ data }) => setTrending((data as Product[]) ?? []))

    supabase.from('products').select('*').eq('active', true).order('created_at', { ascending: false }).limit(6)
      .then(({ data }) => setNewArrivals((data as Product[]) ?? []))

    supabase.from('products').select('*').eq('active', true).eq('is_bundle', true).order('created_at', { ascending: false }).limit(4)
      .then(({ data }) => setBundles((data as Product[]) ?? []))

    supabase.from('products').select('*').eq('active', true).eq('price', 0).order('featured', { ascending: false }).order('created_at', { ascending: false }).limit(1)
      .then(({ data }) => setFreeProduct((data as Product[])?.[0] ?? null))

    supabase.from('site_settings').select('key, value').in('key', ['hero', 'chapters', 'homepage_layout', 'testimonials'])
      .then(({ data }) => {
        for (const row of data ?? []) {
          if (row.key === 'hero') setHero(row.value as HeroContent)
          if (row.key === 'chapters') setChapters(row.value as ChapterContent[])
          if (row.key === 'homepage_layout') setLayout(mergeLayout(row.value as LayoutSection[]))
          if (row.key === 'testimonials') setTestimonials((row.value as TestimonialContent[]).filter((t) => t.quote && t.name))
        }
      })
      .then(() => setHeroReady(true), () => setHeroReady(true))

    getCategoriesWithProducts().then(setCategories)

    ;(['beginner', 'intermediate', 'advanced'] as const).forEach((level) => {
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('active', true).eq('skill_level', level)
        .then(({ count }) => setSkillCounts((prev) => ({ ...prev, [level]: count ?? 0 })))
    })
  }, [])

  useEffect(() => {
    setSkillLoading(true)
    supabase.from('products').select('*').eq('active', true).eq('skill_level', activeSkill).order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => {
        setSkillProducts((data as Product[]) ?? [])
        setSkillLoading(false)
      })
  }, [activeSkill])

  const sections: Record<LayoutSection['id'], React.ReactNode> = {
    hero: (
      <section className="overflow-hidden" style={{ background: 'var(--color-background)' }}>
        <div className="max-w-site w-full mx-auto px-6 md:px-16 py-10 md:py-0 grid grid-cols-1 md:grid-cols-[45%_55%] gap-10 md:gap-12 items-center md:h-[520px]">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] mb-4" style={{ color: 'var(--color-accent)' }}>{hero?.eyebrow || 'CROCHET PATTERNS FOR EVERY MAKER'}</p>
            <h1 className="font-heading font-semibold text-4xl md:text-5xl lg:text-6xl leading-[1.05] mb-5">
              <span className="block text-ink">Beautiful Patterns.</span>
              <span className="block" style={{ color: 'var(--color-accent)' }}>Made for You.</span>
            </h1>
            <p className="text-[15px] text-ink-soft leading-relaxed mb-7 max-w-md">
              Instantly download easy-to-follow crochet patterns designed with love for makers around the world.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
              <Link
                href={hero?.cta_link || '/shop/new'}
                className="w-full sm:w-auto text-center px-6 py-3 rounded-lg text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
                style={{ background: 'var(--color-accent)' }}
              >
                {hero?.cta_text || 'Shop Patterns'}
              </Link>
              <Link
                href={hero?.secondary_cta_link || '/shop?price=free'}
                className="w-full sm:w-auto text-center px-6 py-3 rounded-lg text-[13px] font-semibold border bg-white hover:bg-surface transition-colors"
                style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
              >
                {hero?.secondary_cta_text || 'Explore Free Patterns'}
              </Link>
            </div>

            {/* Mobile: image sits here, right after the CTAs, before the benefits row */}
            <div className="md:hidden mb-8">
              {!heroReady ? (
                <div className="h-[280px] rounded-[18px] bg-surface animate-pulse" aria-hidden />
              ) : currentHeroGroup.length > 0 ? (
                <>
                  <HeroCollage group={currentHeroGroup} />
                  {heroGroups.length > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-3">
                      {heroGroups.map((_, i) => (
                        <button key={i} onClick={() => setHeroSlide(i)} aria-label={`Show hero image set ${i + 1}`} className="w-1.5 h-1.5 rounded-full transition-colors" style={{ background: i === heroSlide ? 'var(--color-accent)' : 'var(--color-border)' }} />
                      ))}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>

          {/* Desktop: collage lives in the right column */}
          <div className="hidden md:block">
            {!heroReady ? (
              <div className="h-[420px] rounded-[18px] bg-surface animate-pulse" aria-hidden />
            ) : currentHeroGroup.length > 0 ? (
              <>
                <HeroCollage group={currentHeroGroup} className="h-[420px]" />
                {heroGroups.length > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    {heroGroups.map((_, i) => (
                      <button key={i} onClick={() => setHeroSlide(i)} aria-label={`Show hero image set ${i + 1}`} className="w-1.5 h-1.5 rounded-full transition-colors" style={{ background: i === heroSlide ? 'var(--color-accent)' : 'var(--color-border)' }} />
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </section>
    ),
    trust: (
      <section className="max-w-site w-full mx-auto px-6 md:px-16 -mt-6 md:-mt-8 relative z-10">
        <div className="bg-canvas border border-line rounded-xl px-4 md:px-10 py-5 flex flex-nowrap items-start md:items-center justify-between md:justify-center gap-2 md:gap-x-12">
          {[
            { icon: 'bolt', label: 'Instant Digital Access' },
            { icon: 'verified', label: 'Guaranteed Quality' },
            { icon: 'lock', label: 'Secure Payment' },
          ].map((s) => (
            <div key={s.label} className="flex-1 md:flex-initial flex flex-col md:flex-row items-center md:items-center text-center md:text-left gap-1.5 md:gap-3">
              <MaterialIcon name={s.icon} size={20} color="var(--color-primary)" />
              <p className="text-[11px] md:text-[14px] font-semibold leading-tight md:whitespace-nowrap">{s.label}</p>
            </div>
          ))}
        </div>
      </section>
    ),
    categories: categories.length > 0 ? (
      <section className="px-6 md:px-16 py-5 md:py-7 max-w-site w-full mx-auto border-t border-line">
        <p className="text-center text-[11px] tracking-[0.2em] text-ink-soft mb-2">✦</p>
        <div className="relative mb-10">
          <h2 className="font-heading text-center font-semibold text-3xl">Shop by Category</h2>
          <Link href="/shop" className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 text-[11px] tracking-[0.12em] border-b border-ink pb-1 hover:opacity-60">
            VIEW ALL CATEGORIES →
          </Link>
        </div>
        <div className="relative">
          {categories.length > 4 && (
            <button
              onClick={() => categoryScrollRef.current?.scrollBy({ left: -240, behavior: 'smooth' })}
              aria-label="Scroll categories left"
              className="flex absolute -left-2 md:-left-4 top-[42px] -translate-y-1/2 z-10 w-8 h-8 md:w-9 md:h-9 rounded-full bg-canvas border border-line items-center justify-center shadow-sm hover:bg-surface"
            >
              <MaterialIcon name="chevron_left" size={18} />
            </button>
          )}
          <div ref={categoryScrollRef} className="flex gap-4 md:gap-6 overflow-x-auto scroll-smooth pb-2 -mx-1 px-8 md:px-10" style={{ scrollbarWidth: 'none' }}>
            {categories.map((c) => (
              <Link key={c.link} href={c.link} className="group flex flex-col items-center text-center shrink-0 w-[100px] md:w-[120px]">
                <div className="w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-full overflow-hidden bg-surface mb-3 border border-line">
                  {c.image ? (
                    <img src={c.image} alt={c.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MaterialIcon name="image" size={24} color="var(--color-muted)" />
                    </div>
                  )}
                </div>
                <p className="font-medium text-[13px]">{c.name}</p>
                <p className="text-[11px] text-ink-soft mt-0.5">{c.count > 0 ? `${c.count}+ Patterns` : '0 Patterns'}</p>
              </Link>
            ))}
          </div>
          {categories.length > 4 && (
            <button
              onClick={() => categoryScrollRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}
              aria-label="Scroll categories right"
              className="flex absolute -right-2 md:-right-4 top-[42px] -translate-y-1/2 z-10 w-8 h-8 md:w-9 md:h-9 rounded-full bg-canvas border border-line items-center justify-center shadow-sm hover:bg-surface"
            >
              <MaterialIcon name="chevron_right" size={18} />
            </button>
          )}
        </div>
      </section>
    ) : null,
    chapters: chapters.length > 0 ? (
      <section className="px-6 md:px-16 py-5 md:py-7 max-w-site w-full mx-auto border-t border-line">
        <p className="text-center text-[11px] tracking-[0.2em] text-ink-soft mb-2">✦</p>
        <h2 className="font-heading text-center font-semibold text-3xl mb-10">Skill Level Chapters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {chapters.map((c) => {
            const badgeColor = 'var(--color-primary)'
            return (
              <Link key={c.title} href={c.link} className="group block bg-white rounded-2xl border border-line overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative aspect-[4/3] bg-surface overflow-hidden">
                  {c.image && <img src={c.image} alt={c.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />}
                  <span className="absolute top-3 left-3 text-[9px] font-semibold tracking-wide text-white px-2.5 py-1 rounded-full uppercase" style={{ background: badgeColor }}>
                    {c.level}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="font-heading font-semibold text-xl mb-2">{c.title}</h3>
                  <p className="text-[13px] text-ink-soft leading-relaxed mb-4">{c.copy}</p>
                  <span className="text-[12px] font-semibold" style={{ color: badgeColor }}>Explore →</span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    ) : null,
    trending: trending.length > 0 ? (
      <section className="px-6 md:px-16 py-5 md:py-7 max-w-site w-full mx-auto border-t border-line">
        <h2 className="font-heading text-center font-semibold text-2xl md:text-3xl mb-8">Featured Items</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-6 lg:gap-x-8 gap-y-10 lg:gap-y-12">
          {trending.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
        </div>
        <div className="text-center mt-10">
          <Link
            href="/shop/bestsellers"
            className="inline-block px-7 py-3 rounded-lg border text-[12px] font-semibold tracking-[0.06em] transition-colors border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white"
          >
            VIEW ALL
          </Link>
        </div>
      </section>
    ) : null,
    new_arrivals: newArrivals.length > 0 ? (
      <section className="px-6 md:px-16 py-5 md:py-7 max-w-site w-full mx-auto border-t border-line">
        <h2 className="font-heading text-center font-semibold text-2xl md:text-3xl mb-8">New Arrivals</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-5 lg:gap-x-6 gap-y-10 lg:gap-y-12">
          {newArrivals.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        <div className="text-center mt-10">
          <Link
            href="/shop/new"
            className="inline-block px-7 py-3 rounded-lg border text-[12px] font-semibold tracking-[0.06em] transition-colors border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white"
          >
            VIEW ALL
          </Link>
        </div>
      </section>
    ) : null,
    skill_browse: (
      <section className="px-6 md:px-16 py-5 md:py-7 max-w-site w-full mx-auto">
        <div className="bg-surface border border-line rounded-2xl p-6 md:p-8 flex flex-col lg:flex-row gap-6">
          <div className="lg:w-[200px] shrink-0">
            <p className="font-heading font-semibold text-lg mb-4">Browse by Skill Level</p>
            <div className="grid grid-cols-3 lg:flex lg:flex-col gap-2">
              {([
                { level: 'beginner' as const, icon: 'eco' },
                { level: 'intermediate' as const, icon: 'layers' },
                { level: 'advanced' as const, icon: 'military_tech' },
              ]).map((s) => (
                <button
                  key={s.level}
                  onClick={() => setActiveSkill(s.level)}
                  className={`flex flex-col lg:flex-row items-center lg:items-center gap-1.5 lg:gap-2.5 px-2 lg:px-3.5 py-3 rounded-lg text-center lg:text-left transition-colors ${activeSkill === s.level ? 'text-white' : 'bg-white hover:bg-canvas text-ink'}`}
                  style={activeSkill === s.level ? { background: 'var(--color-primary)' } : undefined}
                >
                  <MaterialIcon name={s.icon} size={16} color={activeSkill === s.level ? '#fff' : 'var(--color-primary)'} />
                  <span className="leading-tight">
                    <span className="block text-[12px] lg:text-[13px] font-semibold capitalize">{s.level}</span>
                    <span className={`block text-[10px] lg:text-[11px] whitespace-nowrap ${activeSkill === s.level ? 'text-white/80' : 'text-ink-soft'}`}>{skillCounts[s.level]} Patterns</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {skillLoading ? (
              <HomeSectionSkeleton count={3} />
            ) : skillProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-6">
                {skillProducts.slice(0, 3).map((p) => (
                  <Link key={p.id} href={`/pattern/${p.slug}`} className="group block">
                    <div className="aspect-square rounded-xl overflow-hidden bg-canvas mb-2">
                      {p.images?.[0] && <img src={p.images[0]} alt={p.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                    </div>
                    <p className="text-[12px] font-medium leading-tight line-clamp-1">{p.title}</p>
                    <p className="text-[13px] font-semibold text-ink mt-0.5">{p.price === 0 ? 'Free' : `$${p.price.toFixed(2)}`}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-ink-soft text-[13px] text-center px-6">
                No {activeSkill} patterns yet — check back soon.
              </div>
            )}
          </div>

          {layout.find((s) => s.id === 'bundles')?.visible && bundles.length > 0 && (
            <div className="lg:w-[300px] shrink-0 rounded-xl p-6" style={{ background: 'var(--color-accent-soft)' }}>
              <p className="font-heading font-semibold text-lg mb-1.5">Pattern Bundles</p>
              <p className="text-[12px] text-ink-soft mb-3 leading-relaxed">More patterns, more value. Save up to 40% on curated bundles.</p>
              <Link
                href="/shop?bundle=1"
                className="inline-block px-4 py-2 rounded-lg text-white text-[11px] font-semibold hover:opacity-90 transition-opacity mb-4"
                style={{ background: 'var(--color-accent)' }}
              >
                Shop Bundles →
              </Link>
              <div className="grid grid-cols-2 gap-2">
                {bundles.slice(0, 2).map((b) => {
                  const savePct = b.compare_at_price ? Math.round((1 - b.price / b.compare_at_price) * 100) : null
                  return (
                    <Link key={b.id} href={`/pattern/${b.slug}`} className="group block">
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-white mb-1.5">
                        {b.images?.[0] && <img src={b.images[0]} alt={b.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                        {savePct !== null && savePct > 0 && (
                          <span className="absolute top-1.5 left-1.5 text-[8px] font-semibold text-white px-1.5 py-0.5 rounded-full" style={{ background: 'var(--color-primary)' }}>
                            SAVE {savePct}%
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-medium leading-tight line-clamp-1">{b.title}</p>
                      <p className="text-[11px] text-ink-soft">{b.bundle_includes.length} Patterns</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[12px] font-semibold text-ink">${b.price.toFixed(2)}</span>
                        {b.compare_at_price && b.compare_at_price > b.price && <span className="text-[10px] line-through text-ink-soft">${b.compare_at_price.toFixed(2)}</span>}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    ),
    free_patterns: freeProduct ? (
      <section className="px-6 md:px-16 py-5 md:py-7 max-w-site w-full mx-auto">
        <div className="bg-surface border border-line rounded-2xl p-8 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-3">FREE PATTERNS</p>
            <h2 className="font-heading font-semibold text-2xl mb-2">Start With Free</h2>
            <p className="text-[13px] text-ink-soft mb-6 max-w-xs">Explore our collection of beautiful free crochet patterns.</p>
            <Link
              href="/shop?price=free"
              className="inline-block px-6 py-3 rounded-lg text-white text-[12px] font-semibold tracking-[0.06em] hover:opacity-90 transition-opacity"
              style={{ background: 'var(--color-accent)' }}
            >
              EXPLORE FREE PATTERNS
            </Link>
          </div>
          {freeProduct.images?.[0] && (
            <img src={freeProduct.images[0]} alt={freeProduct.title} loading="lazy" className="w-[140px] h-[140px] md:w-[160px] md:h-[160px] rounded-xl object-cover shrink-0" />
          )}
        </div>
      </section>
    ) : null,
    bundles: null,
    why_us: (
      <section className="px-6 md:px-16 py-5 md:py-7 max-w-site w-full mx-auto border-t border-line">
        <p className="text-center text-[11px] tracking-[0.2em] text-ink-soft mb-2">✦</p>
        <h2 className="font-heading text-center font-semibold text-3xl mb-10">Why Makers Love NCA</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8">
          {[
            { icon: 'checklist', title: 'Easy to Follow', copy: 'Clear instructions for every step' },
            { icon: 'verified', title: 'Tested Patterns', copy: 'Every pattern is tested twice' },
            { icon: 'favorite', title: 'Wishlist & Save', copy: 'Save favorite patterns for later' },
            { icon: 'all_inclusive', title: 'Lifetime Access', copy: 'Download anytime, forever' },
            { icon: 'picture_as_pdf', title: 'Printable PDF', copy: 'High-quality PDFs ready to print' },
            { icon: 'redeem', title: 'Pattern Bundles', copy: 'More patterns, better value' },
          ].map((b) => (
            <div key={b.title} className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border" style={{ borderColor: 'var(--color-primary)' }}>
                <MaterialIcon name={b.icon} size={20} color="var(--color-primary)" />
              </div>
              <div>
                <p className="text-[14px] font-semibold">{b.title}</p>
                <p className="text-[12px] text-ink-soft">{b.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    ),
    testimonials: testimonials.length > 0 ? (
      <section className="px-6 md:px-16 py-5 md:py-7 max-w-site w-full mx-auto border-t border-line">
        <p className="text-center text-[11px] tracking-[0.2em] text-ink-soft mb-2">✦</p>
        <h2 className="font-heading text-center font-semibold text-3xl mb-10">What Our Makers Say</h2>
        {(() => {
          const perPage = 3
          const pageCount = Math.ceil(testimonials.length / perPage)
          const page = Math.min(testimonialPage, pageCount - 1)
          const pageItems = testimonials.slice(page * perPage, page * perPage + perPage)
          return (
            <div className="relative">
              {pageCount > 1 && (
                <button
                  onClick={() => setTestimonialPage((p) => (p - 1 + pageCount) % pageCount)}
                  aria-label="Previous testimonials"
                  className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-line items-center justify-center shadow-sm hover:bg-surface"
                >
                  <MaterialIcon name="chevron_left" size={18} />
                </button>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {pageItems.map((t, i) => (
                  <div key={`${page}-${i}`} className="bg-surface border border-line rounded-2xl p-6">
                    <div className="flex gap-0.5 mb-3" style={{ color: 'var(--color-gold)' }}>
                      {Array.from({ length: 5 }).map((_, si) => <MaterialIcon key={si} name="star" size={15} />)}
                    </div>
                    <p className="text-[13px] leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      {t.photo ? (
                        <img src={t.photo} alt={t.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--color-primary-soft)' }}>
                          <MaterialIcon name="person" size={16} color="var(--color-primary)" />
                        </div>
                      )}
                      <div className="leading-tight">
                        <p className="text-[13px] font-semibold">{t.name}</p>
                        <p className="text-[11px] text-ink-soft">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {pageCount > 1 && (
                <button
                  onClick={() => setTestimonialPage((p) => (p + 1) % pageCount)}
                  aria-label="Next testimonials"
                  className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-line items-center justify-center shadow-sm hover:bg-surface"
                >
                  <MaterialIcon name="chevron_right" size={18} />
                </button>
              )}
              {pageCount > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  {Array.from({ length: pageCount }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setTestimonialPage(i)}
                      aria-label={`Go to testimonials page ${i + 1}`}
                      className="w-2 h-2 rounded-full transition-colors"
                      style={{ background: i === page ? 'var(--color-accent)' : 'var(--color-border)' }}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })()}
      </section>
    ) : null,
    newsletter: <NewsletterBanner image={hero?.images?.[0]} />,
  }

  return (
    <div>
      {layout.filter((s) => s.visible).map((s) => <div key={s.id}>{sections[s.id]}</div>)}
    </div>
  )
}
