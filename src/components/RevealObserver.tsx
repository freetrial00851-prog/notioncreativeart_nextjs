'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Scroll reveal: blocks marked `.reveal` slide up + fade in the first time they scroll into view.
 * An element is only hidden after JS "arms" it (`data-armed`), and elements already on screen are
 * never armed, so SSR, no-JS and late-rendered content always stay visible. Siblings that reveal
 * together are staggered (90ms steps, 4 per row) so grids cascade instead of popping at once.
 */
export function RevealObserver() {
  const pathname = usePathname()

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const io = new IntersectionObserver(
      (entries) => {
        // Entries in the same batch cascade in DOM order.
        const batch = entries.filter((e) => e.isIntersecting).sort((a, b) => (a.boundingClientRect.top - b.boundingClientRect.top) || (a.boundingClientRect.left - b.boundingClientRect.left))
        batch.forEach((e, i) => {
          const el = e.target as HTMLElement
          el.style.transitionDelay = `${Math.min(i, 5) * 90}ms`
          el.classList.add('is-in')
          io.unobserve(el)
          // Don't leave the stagger delay on hover/press transitions afterwards.
          window.setTimeout(() => { el.style.transitionDelay = '' }, 1300)
        })
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    )
    // Elements already on screen are only remembered here (no DOM changes), so nothing we do
    // can disagree with server-rendered markup that React is still hydrating.
    const seen = new WeakSet<Element>()
    const arm = () => {
      document.querySelectorAll<HTMLElement>('.reveal:not(.is-in)').forEach((el) => {
        if (!el.hasAttribute('data-armed') && (seen.has(el) || el.getBoundingClientRect().top < window.innerHeight * 0.92)) {
          seen.add(el)
          return
        }
        // Re-observing an already-armed element is harmless and keeps it alive across
        // observer re-creation (StrictMode, route changes).
        el.setAttribute('data-armed', '')
        io.observe(el)
      })
    }
    // Wait for hydration to settle before touching below-the-fold elements.
    const start = window.setTimeout(() => {
      document.documentElement.classList.add('js-reveal')
      arm()
    }, 700)
    let raf = 0
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(arm)
    })
    mo.observe(document.body, { childList: true, subtree: true })
    return () => {
      mo.disconnect()
      io.disconnect()
      cancelAnimationFrame(raf)
      window.clearTimeout(start)
    }
  }, [pathname])

  return null
}
