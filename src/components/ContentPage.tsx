'use client'

import type { ReactNode } from 'react'

export function ContentPage({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto px-6 md:px-8 py-16 md:py-20">
      <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-4">{eyebrow}</p>
      <h1 className="font-display font-semibold text-4xl mb-10">{title}</h1>
      <div className="prose-content text-[14px] leading-relaxed text-ink-soft space-y-5">{children}</div>
    </div>
  )
}
