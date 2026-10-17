/**
 * First-party analytics events → Supabase Edge Function `track-event` → `public.events`.
 *
 * Safety:
 *  - OFF unless NEXT_PUBLIC_EVENT_TRACKING === 'on' (so nothing changes on the live
 *    site until the SQL + edge function from supabase/admin-analytics.sql are deployed).
 *  - Fire-and-forget: never awaited by callers, never throws, never blocks the UI.
 *  - Consent: session id / referrer / utm / device / user are sent ONLY when the visitor
 *    accepted cookies (same key as CookieConsent). Otherwise the event is anonymous
 *    (name + path + product). The edge function enforces this again server-side.
 *  - If the function is missing (404) tracking switches itself off for the session.
 */
import { supabase } from './supabase'

export type TrackEvent =
  | 'page_view'
  | 'view_item'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'add_to_wishlist'
  | 'remove_from_wishlist'
  | 'begin_checkout'
  | 'purchase'
  | 'free_download'
  | 'download'
  | 'search'
  | 'sign_up'
  | 'login'
  | 'newsletter_subscribe'
  | 'chat_open'
  | 'review_submit'
  | 'share'

const CONSENT_KEY = 'nca_cookie_consent'
const SID_KEY = 'nca_sid'
const ATTR_KEY = 'nca_attr'
const OFF_KEY = 'nca_track_off'

export const TRACKING_ENABLED = process.env.NEXT_PUBLIC_EVENT_TRACKING === 'on'

function hasConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'accepted'
  } catch {
    return false
  }
}

function sessionId(): string | null {
  try {
    let id = sessionStorage.getItem(SID_KEY)
    if (!id) {
      id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/-/g, '').slice(0, 32)
      sessionStorage.setItem(SID_KEY, id)
    }
    return id
  } catch {
    return null
  }
}

type Attribution = { referrer: string | null; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null }

/** Captured once per session (first touch). */
function attribution(): Attribution {
  try {
    const saved = sessionStorage.getItem(ATTR_KEY)
    if (saved) return JSON.parse(saved) as Attribution
    const q = new URLSearchParams(window.location.search)
    let referrer: string | null = null
    try {
      if (document.referrer) {
        const host = new URL(document.referrer).hostname.replace(/^www\./, '')
        if (host && host !== window.location.hostname.replace(/^www\./, '')) referrer = host
      }
    } catch {
      /* ignore bad referrer */
    }
    const a: Attribution = {
      referrer,
      utm_source: q.get('utm_source'),
      utm_medium: q.get('utm_medium'),
      utm_campaign: q.get('utm_campaign'),
    }
    sessionStorage.setItem(ATTR_KEY, JSON.stringify(a))
    return a
  } catch {
    return { referrer: null, utm_source: null, utm_medium: null, utm_campaign: null }
  }
}

function deviceClass(): 'mobile' | 'tablet' | 'desktop' {
  const w = window.innerWidth
  return w < 768 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop'
}

export function track(
  event: TrackEvent,
  data: { path?: string; productId?: string | null; props?: Record<string, string | number | boolean> } = {},
): void {
  if (!TRACKING_ENABLED || typeof window === 'undefined') return
  try {
    if (sessionStorage.getItem(OFF_KEY) === '1') return
    const path = (data.path ?? window.location.pathname).split('?')[0]
    if (path.startsWith('/admin')) return
    const consent = hasConsent()
    const body: Record<string, unknown> = {
      event_name: event,
      path,
      product_id: data.productId ?? null,
      props: data.props ?? {},
      consent,
    }
    if (consent) {
      Object.assign(body, attribution(), { session_id: sessionId(), device: deviceClass() })
    }
    void supabase.functions
      .invoke('track-event', { body })
      .then(({ error }) => {
        const status = (error as { context?: Response } | null)?.context?.status
        if (error && (status === 404 || /not found|failed to send/i.test(String((error as Error).message)))) {
          try {
            sessionStorage.setItem(OFF_KEY, '1')
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {})
  } catch {
    /* tracking must never break the app */
  }
}
