'use client'

import { useEffect, useState, type ReactNode } from 'react'

/**
 * Renders its children once the page has finished its first work and the browser is idle (or at once when `now` is true).
 * With `whenIdle={false}` it waits for `now` only, so the code is not even downloaded until it is needed.
 * Used with next/dynamic for parts nobody sees on arrival (cart drawer, sign-in sheet, chat): their code is downloaded
 * and run after the page is usable instead of competing with it, and they are ready by the time anyone reaches for them.
 */
export function Deferred({ children, now = false, whenIdle = true }: { children: ReactNode; now?: boolean; whenIdle?: boolean }) {
  const [idle, setIdle] = useState(false)

  useEffect(() => {
    if (!whenIdle) return
    const go = () => setIdle(true)
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(go, { timeout: 4000 })
      return () => window.cancelIdleCallback(id)
    }
    const t = setTimeout(go, 2000)
    return () => clearTimeout(t)
  }, [whenIdle])

  return idle || now ? <>{children}</> : null
}
