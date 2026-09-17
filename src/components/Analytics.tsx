'use client'

import { useEffect, useState } from 'react'
import { GoogleAnalytics } from '@next/third-parties/google'
import { COOKIE_CONSENT_KEY, COOKIE_CONSENT_EVENT } from './CookieConsent'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID as string | undefined

function hasAnalyticsConsent(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted'
}

/**
 * Consent-gated GA4 via Next.js official `@next/third-parties/google`.
 * Mounts only after cookie Accept — App Router route changes are handled by the component.
 */
export function Analytics() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return

    const enable = () => setEnabled(true)

    if (hasAnalyticsConsent()) enable()

    const onConsentChange = (e: Event) => {
      const detail = (e as CustomEvent<'accepted' | 'rejected'>).detail
      if (detail === 'accepted') enable()
    }
    window.addEventListener(COOKIE_CONSENT_EVENT, onConsentChange)
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onConsentChange)
  }, [])

  if (!enabled || !GA_MEASUREMENT_ID) return null

  return <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
}
