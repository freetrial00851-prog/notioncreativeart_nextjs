'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { COOKIE_CONSENT_KEY, COOKIE_CONSENT_EVENT } from './CookieConsent'
import {
  PINTEREST_TAG_ID,
  loadPinterestTag,
  trackPinterestPage,
} from '@/lib/pinterest'

function hasAnalyticsConsent(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted'
}

/**
 * Consent-gated Pinterest Tag — loads core.js after cookie accept, then
 * pintrk('page') on each App Router navigation (same lifecycle as GA).
 */
export function PinterestTag() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [ready, setReady] = useState(false)
  const lastTrackedPath = useRef<string | null>(null)

  const pagePath =
    searchParams?.toString() ? `${pathname}?${searchParams.toString()}` : (pathname ?? '/')

  useEffect(() => {
    if (!PINTEREST_TAG_ID) return

    const enable = () => {
      if (loadPinterestTag()) {
        setReady(true)
        lastTrackedPath.current = null
      }
    }

    if (hasAnalyticsConsent()) enable()

    const onConsentChange = (e: Event) => {
      const detail = (e as CustomEvent<'accepted' | 'rejected'>).detail
      if (detail === 'accepted') enable()
    }
    window.addEventListener(COOKIE_CONSENT_EVENT, onConsentChange)
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onConsentChange)
  }, [])

  useEffect(() => {
    if (!ready || !PINTEREST_TAG_ID) return
    if (lastTrackedPath.current === pagePath) return
    lastTrackedPath.current = pagePath
    trackPinterestPage()
  }, [ready, pagePath])

  return null
}
