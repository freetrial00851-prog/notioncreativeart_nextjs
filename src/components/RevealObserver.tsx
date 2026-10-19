'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Fallback for the CSS scroll-reveal (`.reveal`) in browsers without `animation-timeline`.
 * An element is only ever hidden after JS has "armed" it (`data-armed`), and elements already
 * on screen are never armed, so SSR, no-JS and late-rendered content always stay visible.
 */
export function RevealObserver() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()')) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        }),
      { rootMargin: '0px 0px -8% 0px' },
    )
    const arm = () => {
      document.querySelectorAll<HTMLElement>('.reveal:not([data-armed]):not(.is-in)').forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add('is-in')
        } else {
          el.setAttribute('data-armed', '')
          io.observe(el)
        }
      })
    }
    document.documentElement.classList.add('js-reveal')
    arm()
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
    }
  }, [pathname])

  return null
}
