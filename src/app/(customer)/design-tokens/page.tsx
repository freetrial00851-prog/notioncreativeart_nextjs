/* TEMPORARY - delete before merging to main */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Design tokens (temporary)',
  robots: { index: false, follow: false },
}

const COLORS: { name: string; varName: string; hex: string }[] = [
  { name: 'Primary', varName: '--color-primary', hex: '#1f249c' },
  { name: 'Primary hover', varName: '--color-primary-hover', hex: '#191d7d' },
  { name: 'Primary soft', varName: '--color-primary-soft', hex: '#e9eaf5' },
  { name: 'Background', varName: '--color-background', hex: '#FCFBF8' },
  { name: 'Surface', varName: '--color-surface', hex: '#F8F4ED' },
  { name: 'Card', varName: '--color-card', hex: '#FFFFFF' },
  { name: 'Border', varName: '--color-border', hex: '#E7E1D8' },
  { name: 'Ink', varName: '--color-ink', hex: '#1F2933' },
  { name: 'Muted', varName: '--color-muted', hex: '#5B6472' },
  { name: 'Logo accent', varName: '--color-logo-accent', hex: '#D68A3E' },
  { name: 'Moss', varName: '--color-moss', hex: '#6F8760' },
  { name: 'Moss soft', varName: '--color-moss-soft', hex: '#EEF2E8' },
  { name: 'Gold', varName: '--color-gold', hex: '#D9A441' },
  { name: 'Sale red', varName: '--color-sale', hex: '#B83230' },
  { name: 'Footer', varName: '--color-footer', hex: '#202720' },
  { name: 'Skill beginner', varName: '--color-skill-beginner-soft', hex: '#C3E0A8' },
  { name: 'Skill intermediate', varName: '--color-skill-intermediate-soft', hex: '#FADE8A' },
  { name: 'Skill advanced', varName: '--color-skill-advanced-soft', hex: '#F5BFA8' },
]

export default function DesignTokensPage() {
  return (
    <div className="max-w-site mx-auto px-6 md:px-16 py-12 space-y-12">
      <header className="space-y-2">
        <p className="text-[11px] tracking-[0.15em] text-ink-soft uppercase">Temporary review page</p>
        <h1 className="font-display text-3xl font-semibold text-ink">Design tokens</h1>
        <p className="text-[14px] text-ink-soft max-w-xl">
          Step 1 only — colors, fonts, focus, and touch-target helpers. Delete this route before merging to main.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Colors</h2>
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {COLORS.map((c) => (
            <li key={c.varName} className="rounded-xl border border-line overflow-hidden bg-card">
              <div className="h-16 w-full" style={{ background: `var(${c.varName})` }} />
              <div className="p-3 space-y-0.5">
                <p className="text-[13px] font-semibold text-ink">{c.name}</p>
                <p className="text-[11px] text-ink-soft font-mono">{c.hex}</p>
                <p className="text-[10px] text-ink-light font-mono break-all">{c.varName}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Fonts</h2>
        <div className="space-y-3 rounded-xl border border-line bg-card p-6">
          <p className="font-body text-[16px] text-ink">Manrope — body / UI / font-display (this step)</p>
          <p className="font-heading text-[28px] font-semibold text-ink">Playfair Display — font-heading</p>
          <p className="font-logo text-[32px] font-extrabold" style={{ color: 'var(--color-primary)' }}>
            Baloo 2 — logo
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Focus + touch target</h2>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            className="touch-target px-5 rounded-full text-[13px] font-semibold text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            Focus me (Tab)
          </button>
          <button
            type="button"
            aria-label="Icon-only sample"
            className="touch-target inline-flex items-center justify-center rounded-full border border-line bg-card"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4l2.5 2.5" />
            </svg>
          </button>
          <div className="product-image-square w-20 rounded-lg bg-surface border border-line" aria-hidden />
        </div>
        <p className="text-[12px] text-ink-soft">
          Breakpoint tokens (CSS only): design-mobile 390 · design-tablet 834 · design-laptop 1440 · design-md 768 · design-lg 1200.
          Header tiers 481 / 1025 unchanged. Tailwind sm/md/lg/xl unchanged.
        </p>
      </section>
    </div>
  )
}
