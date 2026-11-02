const HEADER_OFFSET = 96
const DURATION_MS = 500

/**
 * Scrolls to the element with this id. Done by hand because a plain #hash link is overridden by
 * the site's scroll restore, and the browser's own smooth scroll is not reliable everywhere.
 * Returns false when the element does not exist, so the caller can let the link behave normally.
 */
export function scrollToId(id: string): boolean {
  const el = document.getElementById(id)
  if (!el) return false
  const target = Math.max(0, el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo(0, target)
    return true
  }
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
  return true
}
