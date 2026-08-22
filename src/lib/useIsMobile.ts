'use client'

import { useEffect, useState } from 'react'

/**
 * True when the viewport is narrower than the given breakpoint (default
 * matches Tailwind's `md` at 768px). Reactive to resize/rotation so
 * behavior (e.g. sheet vs full page) stays correct if the window is resized
 * or a device is rotated while mounted.
 */
export function useIsMobile(breakpointPx = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpointPx : false
  )

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`)
    const handler = () => setIsMobile(mql.matches)
    handler()
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [breakpointPx])

  return isMobile
}
