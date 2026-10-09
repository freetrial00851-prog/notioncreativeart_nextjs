'use client'

import { useState, type ReactNode } from 'react'

export type FaqItem = { question: string; answer: ReactNode }

/** One-open-at-a-time FAQ — DESIGN_SPEC §3.11 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState(0)

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={item.question} className="rounded-2xl border border-border bg-surface overflow-hidden">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-[14px] font-semibold text-ink leading-snug">{item.question}</span>
              <span className="shrink-0 text-primary text-xl leading-none font-medium" aria-hidden>
                {isOpen ? '−' : '+'}
              </span>
            </button>
            {isOpen && (
              <div className="px-5 pb-4 text-[14px] text-muted leading-relaxed">{item.answer}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
