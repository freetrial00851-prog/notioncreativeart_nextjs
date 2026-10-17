import { useSyncExternalStore } from 'react'
import { supabase } from './supabase'
import { track } from './track'

/**
 * Remembers (per browser) that this visitor subscribed, so every signup form
 * can show "You're subscribed" instead of asking again. Only a flag is stored
 * — never the email. The subscribers table is admin-read-only (RLS), so the
 * browser cannot look this up server-side.
 */
const SUBSCRIBED_KEY = 'nca_newsletter_subscribed'
const SUBSCRIBED_EVENT = 'nca:newsletter-subscribed'

export function isNewsletterSubscribed(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(SUBSCRIBED_KEY) === '1'
  } catch {
    return false
  }
}

function rememberSubscribed() {
  try {
    localStorage.setItem(SUBSCRIBED_KEY, '1')
  } catch {
    /* private mode / quota — the success message still shows this session */
  }
  window.dispatchEvent(new Event(SUBSCRIBED_EVENT))
}

function subscribeToStore(onChange: () => void) {
  window.addEventListener(SUBSCRIBED_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(SUBSCRIBED_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

/** Reactive "already subscribed" flag; false during SSR so markup matches hydration. */
export function useNewsletterSubscribed(): boolean {
  return useSyncExternalStore(subscribeToStore, isNewsletterSubscribed, () => false)
}

/** Calls the subscribe-newsletter Edge Function (real server-side rate
 *  limiting) instead of inserting into newsletter_subscribers directly. */
export async function subscribeToNewsletter(email: string): Promise<{ ok: boolean; error: string | null }> {
  const { data, error } = await supabase.functions.invoke('subscribe-newsletter', { body: { email } })
  if (error) {
    // supabase-js only sets `error` (with `data` null) on a non-2xx status —
    // the function still returns a JSON body with a specific message, so
    // pull the real reason out of the response instead of a generic one.
    try {
      const context = (error as { context?: Response }).context
      if (context && typeof context.json === 'function') {
        const body = await context.json()
        if (body?.error) return { ok: false, error: body.error }
      }
    } catch {
      // fall through to the generic message below
    }
    return { ok: false, error: "Couldn't subscribe — please try again." }
  }
  if (data?.error) return { ok: false, error: data.error }
  rememberSubscribed()
  track('newsletter_subscribe')
  return { ok: true, error: null }
}
