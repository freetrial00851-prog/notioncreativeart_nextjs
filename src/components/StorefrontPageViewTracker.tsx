'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { recordPageView } from '@/lib/pageViews'

/** Records one first-party page view per App Router pathname on the storefront. */
export function StorefrontPageViewTracker() {
  const pathname = usePathname()
  const lastTrackedPath = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname) return
    if (lastTrackedPath.current === pathname) return
    lastTrackedPath.current = pathname
    recordPageView(pathname)
  }, [pathname])

  return null
}
