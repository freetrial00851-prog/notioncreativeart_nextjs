'use client'

import { useId, useState, type ReactNode } from 'react'

export type FaqItem = { question: string; answer: ReactNode }

/** One-open-at-a-time FAQ — DESIGN_SPEC §3.11 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState(0)
  const baseId = useId()

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={item.question} className="rounded-2xl border border-border bg-surface overflow-hidden focus-within:ring-2 focus-within:ring-primary">
            <h3>
              <button
                type="button"
                id={`${baseId}-q${i}`}
                aria-expanded={isOpen}
                aria-controls={`${baseId}-a${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-[15px] font-semibold text-ink leading-snug">{item.question}</span>
                <span className="shrink-0 text-primary text-xl leading-none font-medium" aria-hidden>
                  {isOpen ? '−' : '+'}
                </span>
              </button>
            </h3>
            <div
              id={`${baseId}-a${i}`}
              role="region"
              aria-labelledby={`${baseId}-q${i}`}
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
              <div inert={!isOpen} className="overflow-hidden">
                <div className="px-5 pb-4 text-[15px] text-muted leading-relaxed">{item.answer}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
