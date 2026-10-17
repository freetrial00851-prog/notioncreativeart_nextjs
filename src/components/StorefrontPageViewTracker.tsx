'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { recordPageView } from '@/lib/pageViews'
import { track } from '@/lib/track'

/** Records one first-party page view per App Router pathname on the storefront. */
export function StorefrontPageViewTracker() {
  const pathname = usePathname()
  const lastTrackedPath = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname) return
    if (lastTrackedPath.current === pathname) return
    lastTrackedPath.current = pathname
    recordPageView(pathname)
    track('page_view', { path: pathname })
  }, [pathname])

  return null
}
