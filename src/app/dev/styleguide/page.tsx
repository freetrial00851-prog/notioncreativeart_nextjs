/* TEMPORARY styleguide — DESIGN_SPEC step 1-2. Delete before final launch (step 10). */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AnnouncementBar } from '@/components/AnnouncementBar'
import { PatternCard } from '@/components/PatternCard'
import { PatternGrid } from '@/components/PatternGrid'
import { Button } from '@/components/ui/Button'
import { CategoryChip, LevelBadge, StatusBadge } from '@/components/ui/Badge'
import { isVercelProduction } from '@/lib/env'
import type { Product } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Dev styleguide (temporary)',
  robots: { index: false, follow: false },
}

const SAMPLE: Product = {
  id: 'styleguide-sample',
  title: 'Sample amigurumi bunny pattern',
  slug: 'sample-bunny',
  subtitle: null,
  description: null,
  skill_level: 'beginner',
  price: 6.5,
  compare_at_price: 9.5,
  category_id: null,
  images: [],
  pdf_pages: 8,
  materials: null,
  wishlist_count: 0,
  lemon_variant_id: '',
  lemon_numeric_variant_id: null,
  active: true,
  featured: true,
  card_badge: 'sale',
  sold_out: false,
  checkout_mode: 'overlay',
  is_bundle: false,
  bundle_includes: [],
  meta_title: null,
  meta_description: null,
  pdf_filename: null,
  created_at: new Date().toISOString(),
  deleted_at: null,
}

export default function StyleguidePage() {
  if (isVercelProduction()) notFound()

  return (
    <div className="min-h-screen bg-bg text-ink">
      <AnnouncementBar />
      <div className="max-w-site mx-auto px-5 md:px-10 py-12 space-y-14">
        <header className="space-y-2">
          <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-primary">Temporary</p>
          <h1 className="font-heading text-4xl font-bold">Design styleguide</h1>
          <p className="text-[14px] text-muted max-w-xl">
            Steps 1–2: tokens + shared components. Delete this route in the final QA pass.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="font-heading text-2xl font-bold">Colors</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ['primary', 'var(--color-primary)'],
              ['bg', 'var(--color-bg)'],
              ['surface-warm', 'var(--color-surface-warm)'],
              ['footer', 'var(--color-footer)'],
              ['sale', 'var(--color-sale)'],
              ['free', 'var(--color-free)'],
              ['logo-accent', 'var(--color-logo-accent)'],
              ['gold', 'var(--color-gold)'],
            ].map(([name, css]) => (
              <div key={name} className="rounded-xl border border-border overflow-hidden bg-surface">
                <div className="h-14" style={{ background: css }} />
                <p className="p-2 text-[12px] font-medium">{name}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-heading text-2xl font-bold">Buttons</h2>
          <div className="flex flex-wrap gap-3 items-center">
            <Button variant="primary" size="lg">
              Shop all patterns →
            </Button>
            <Button variant="secondary" size="lg">
              Get a free pattern
            </Button>
            <Button variant="ghost">Continue shopping</Button>
            <Button variant="primary" loading>
              Loading
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-heading text-2xl font-bold">Badges</h2>
          <div className="flex flex-wrap gap-2 items-center">
            <StatusBadge status="new" />
            <StatusBadge status="sale" />
            <StatusBadge status="free" />
            <LevelBadge level="beginner" />
            <LevelBadge level="intermediate" />
            <LevelBadge level="advanced" />
            <CategoryChip label="Amigurumi" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-heading text-2xl font-bold">Pattern card / grid</h2>
          <PatternGrid variant="featured">
            <div className="rounded-[18px] border border-border bg-tint-lavender aspect-square flex items-center justify-center text-muted text-sm shadow-image">
              (live PatternCard needs real product data — see Shop)
            </div>
            <PatternCard
              product={{ ...SAMPLE, card_badge: 'new', compare_at_price: null, price: 8 }}
              reviewStats={{ averageRating: 4.8, reviewCount: 12 }}
            />
            <PatternCard
              product={{ ...SAMPLE, skill_level: 'intermediate', card_badge: 'sale' }}
              reviewStats={{ averageRating: 4.9, reviewCount: 4 }}
            />
            <PatternCard
              product={{ ...SAMPLE, skill_level: 'advanced', price: 0, compare_at_price: null, card_badge: null }}
            />
          </PatternGrid>
          <p className="text-[12px] text-muted">
            Cart drawer: open from the header cart icon on any storefront page. Header + Footer render on customer routes.
          </p>
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-surface-warm p-6">
          <h2 className="font-heading text-2xl font-bold">Typography</h2>
          <p className="font-heading text-3xl font-bold">Playfair heading</p>
          <p className="font-body text-[15px]">Manrope body — Clear, tested PDF patterns for every skill level.</p>
          <p className="font-logo text-2xl font-bold text-primary">Baloo 2 logo</p>
        </section>
      </div>
    </div>
  )
}
