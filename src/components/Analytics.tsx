'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { COOKIE_CONSENT_KEY, COOKIE_CONSENT_EVENT } from './CookieConsent'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID as string | undefined

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

function hasAnalyticsConsent(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted'
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
}

function trackPageView(pagePath: string) {
  if (!GA_MEASUREMENT_ID || typeof window.gtag !== 'function' || !hasAnalyticsConsent()) return
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: pagePath,
    anonymize_ip: true,
  })
}

/** Sends GA pageviews on full loads and client-side route changes (after cookie consent). */
export function Analytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [analyticsReady, setAnalyticsReady] = useState(false)
  const lastTrackedPath = useRef<string | null>(null)

  const pagePath =
    searchParams?.toString() ? `${pathname}?${searchParams.toString()}` : (pathname ?? '/')

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return

    const enable = () => {
      loadGoogleAnalytics()
      setAnalyticsReady(true)
      lastTrackedPath.current = null
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
    if (!analyticsReady || !GA_MEASUREMENT_ID) return
    if (lastTrackedPath.current === pagePath) return
    lastTrackedPath.current = pagePath
    trackPageView(pagePath)
  }, [analyticsReady, pagePath])

  return null
}
