import { supabase } from './supabase'

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
  return { ok: true, error: null }
}
