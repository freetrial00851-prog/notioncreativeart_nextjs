'use client'

const HEADER_OFFSET = 96
const DURATION_MS = 500

type Item = { id: string; label: string }

/** In-page jump links that scroll smoothly to a section (a plain #hash link is overridden by the site's scroll restore). */
export function SectionJumpLinks({ items }: { items: Item[] }) {
  const jump = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    e.preventDefault()
    const target = Math.max(0, el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      window.scrollTo(0, target)
      return
    }
    // Stepped by hand: the browser's own smooth scroll is not reliable everywhere.
    const from = window.scrollY
    let start = -1
    const step = (now: number) => {
      if (start < 0) start = now
      const t = Math.min(1, (now - start) / DURATION_MS)
      const eased = 1 - Math.pow(1 - t, 3)
      window.scrollTo(0, from + (target - from) * eased)
      if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }
  return (
    <p className="mb-10 flex flex-wrap gap-x-5 gap-y-2 text-[14px] font-semibold">
      {items.map((i) => (
        <a key={i.id} href={`#${i.id}`} onClick={(e) => jump(e, i.id)} className="inline-flex min-h-11 items-center text-primary hover:underline">
          {i.label}
        </a>
      ))}
    </p>
  )
}
