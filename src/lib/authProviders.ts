import type { User } from '@supabase/supabase-js'

/** True when the user can sign in with email + password (not Google-only). */
export function hasEmailPasswordAuth(user: User | null | undefined): boolean {
  return Boolean(user?.identities?.some((i) => i.provider === 'email'))
}
