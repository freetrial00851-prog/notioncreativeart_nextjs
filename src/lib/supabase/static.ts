import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { env, assertEnv } from '@/lib/env'

/**
 * Anonymous Supabase client for build-time operations (sitemap, generateStaticParams).
 * Does NOT use cookies — safe to call outside a request context.
 */
export function createStaticClient() {
  assertEnv()
  return createSupabaseClient(env.supabaseUrl, env.supabaseAnonKey)
}
