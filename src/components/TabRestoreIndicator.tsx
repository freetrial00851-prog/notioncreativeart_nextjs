'use client'

import { useEffect, useState } from 'react'

/**
 * Lightweight indicator when Chrome restores a discarded tab (full reload) or
 * bfcache pageshow. Does not block SSR/HTML — content stays visible underneath.
 */
export function TabRestoreIndicator() {
  const [visible, setVisible] = useState(() => {
    if (typeof document === 'undefined') return false
    return (document as Document & { wasDiscarded?: boolean }).wasDiscarded === true
  })

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | null = null

    const showBriefly = (ms: number) => {
      setVisible(true)
      if (hideTimer) clearTimeout(hideTimer)
      hideTimer = setTimeout(() => setVisible(false), ms)
    }

    if ((document as Document & { wasDiscarded?: boolean }).wasDiscarded) {
      showBriefly(1400)
    }

    const onPageShow = (event: PageTransitionEvent) => {
      // Restored from back/forward cache — JS heap intact; brief cue only.
      if (event.persisted) showBriefly(700)
    }

    window.addEventListener('pageshow', onPageShow)
    return () => {
      if (hideTimer) clearTimeout(hideTimer)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed top-3 left-1/2 z-[60] -translate-x-1/2"
    >
      <div className="rounded-full border border-line bg-white/95 px-3.5 py-1.5 text-[11px] tracking-[0.08em] text-ink-soft shadow-sm backdrop-blur-sm">
        Restoring…
      </div>
    </div>
  )
}
