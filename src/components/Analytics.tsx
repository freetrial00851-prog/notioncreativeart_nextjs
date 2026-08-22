'use client'

import { useEffect } from 'react'
import { COOKIE_CONSENT_KEY, COOKIE_CONSENT_EVENT } from './CookieConsent'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID as string | undefined

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

function loadGoogleAnalytics() {
  if (!GA_MEASUREMENT_ID || window.gtag) return

  const script = document.createElement('script')
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  script.async = true
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true })
}

export function Analytics() {
  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return

    if (localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted') {
      loadGoogleAnalytics()
    }

    const onConsentChange = (e: Event) => {
      const detail = (e as CustomEvent<'accepted' | 'rejected'>).detail
      if (detail === 'accepted') loadGoogleAnalytics()
    }
    window.addEventListener(COOKIE_CONSENT_EVENT, onConsentChange)
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onConsentChange)
  }, [])

  return null
}
