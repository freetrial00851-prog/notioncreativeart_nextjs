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
          /* fall through */
        }
      }
      // Fail open only on transport/function-missing errors so a deploy lag
      // doesn't lock every customer out of login — platform Auth limits still apply.
      console.warn('auth-rate-limit invoke failed:', error.message)
      return null
    }
    if (data?.error) return String(data.error)
    return null
  } catch (err) {
    console.warn('auth-rate-limit unexpected error:', err)
    return null
  }
}
