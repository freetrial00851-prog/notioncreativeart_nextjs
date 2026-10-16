'use client'

import type { ReactNode } from 'react'

/** Long-form page shell (About, Privacy, Terms, Refund, FAQ…) — same type system as the rest of the site. */
export function ContentPage({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-20">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
      <h1 className="type-h1 mb-8 text-ink md:mb-10">{title}</h1>
      <div className="prose-content space-y-5 text-[15px] leading-relaxed text-muted md:text-[16px] [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4">
        {children}
      </div>
    </div>
  )
}
