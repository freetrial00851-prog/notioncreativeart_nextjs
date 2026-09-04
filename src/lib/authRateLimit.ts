import { supabase } from './supabase'

export type AuthRateAction = 'login' | 'signup' | 'reset'

/**
 * App-level throttle before login / signup / password reset.
 * Uses Edge Function auth-rate-limit + rate_limit_events (same infra as newsletter).
 * Returns an error message when limited; null when the attempt may proceed.
 */
export async function checkAuthRateLimit(
  action: AuthRateAction,
  email?: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('auth-rate-limit', {
      body: { action, email: email?.trim().toLowerCase() || undefined },
    })
    if (error) {
      const context = (error as { context?: Response }).context
      if (context) {
        try {
          const body = await context.json()
          if (typeof body?.error === 'string') return body.error
          if (context.status === 429) {
            return 'Too many attempts — please wait a bit and try again.'
          }
        } catch {
          /* fall through to fail-closed */
        }
      }
      // Fail closed: never allow auth through when the rate-limit check itself fails.
      console.warn('auth-rate-limit invoke failed:', error.message)
      return 'Unable to verify rate limits right now — please try again in a moment.'
    }
    if (data?.error) return String(data.error)
    return null
  } catch (err) {
    console.warn('auth-rate-limit unexpected error:', err)
    return 'Unable to verify rate limits right now — please try again in a moment.'
  }
}
