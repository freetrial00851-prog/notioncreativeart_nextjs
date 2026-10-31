'use client'

import { useId, useState, type ReactNode } from 'react'

/**
 * Hides long text behind a "Read more" button. The text is still in the page HTML (only hidden with CSS),
 * so search engines read all of it, while visitors see a short intro first.
 */
export function CollapsibleContent({
  children,
  moreLabel = 'Read more',
  lessLabel = 'Show less',
}: {
  children: ReactNode
  moreLabel?: string
  lessLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <>
      <div id={id} hidden={!open}>
        {children}
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className="mt-5 inline-flex min-h-11 items-center gap-1.5 border-b-2 border-coral text-[13px] font-bold uppercase tracking-[0.14em] text-ink hover:text-violet"
      >
        {open ? lessLabel : moreLabel}
        <span aria-hidden>{open ? '↑' : '↓'}</span>
      </button>
    </>
  )
}
