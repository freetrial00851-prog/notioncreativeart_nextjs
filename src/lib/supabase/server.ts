import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env, assertEnv } from '@/lib/env'

/**
 * Server Supabase client — use in Server Components, Route Handlers, and generateMetadata.
 * Reads/writes auth cookies so server and client stay in sync.
 */
export async function createClient() {
  assertEnv()
  const cookieStore = await cookies()

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // setAll from a Server Component — middleware handles cookie refresh
        }
      },
    },
  })
}
