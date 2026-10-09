/* TEMPORARY — preview/local only. 404 in Vercel production. */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isVercelProduction } from '@/lib/env'

export const metadata: Metadata = {
  title: 'Design tokens (temporary)',
  robots: { index: false, follow: false },
}

const COLORS: { name: string; varName: string }[] = [
  { name: 'Primary', varName: '--color-primary' },
  { name: 'Background', varName: '--color-bg' },
  { name: 'Surface warm', varName: '--color-surface-warm' },
  { name: 'Footer', varName: '--color-footer' },
  { name: 'Sale', varName: '--color-sale' },
  { name: 'Free', varName: '--color-free' },
  { name: 'Logo accent', varName: '--color-logo-accent' },
  { name: 'Gold', varName: '--color-gold' },
]

export default function DesignTokensPage() {
  if (isVercelProduction()) notFound()

  return (
    <div className="max-w-site mx-auto px-6 md:px-16 py-12 space-y-10">
      <header className="space-y-2">
        <p className="text-[11px] tracking-[0.15em] text-muted uppercase">Temporary review page</p>
        <h1 className="font-heading text-3xl font-bold text-ink">Design tokens</h1>
        <p className="text-[14px] text-muted max-w-xl">
          Preview/local only — hidden in production. Prefer{' '}
          <a href="/dev/styleguide" className="text-primary underline">
            /dev/styleguide
          </a>{' '}
          for the full component kit.
        </p>
      </header>

      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {COLORS.map((c) => (
          <li key={c.varName} className="rounded-xl border border-border overflow-hidden bg-surface">
            <div className="h-16 w-full" style={{ background: `var(${c.varName})` }} />
            <div className="p-3 space-y-0.5">
              <p className="text-[13px] font-semibold text-ink">{c.name}</p>
              <p className="text-[10px] text-muted font-mono break-all">{c.varName}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
