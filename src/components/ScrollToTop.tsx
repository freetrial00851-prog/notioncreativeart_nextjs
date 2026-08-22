'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function ScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    // The browser's own back/forward scroll restoration can fire after this and
    // silently override it (landing back near the footer, wherever the previous
    // page happened to be scrolled). Turning it off puts us in full control.
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    if (hash) {
      const id = hash.slice(1)
      const timer = setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ block: 'start' })
      }, 0)
      return () => clearTimeout(timer)
    }
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
