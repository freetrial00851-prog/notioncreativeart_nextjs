'use client'

import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/lib/env'

/**
 * Browser Supabase client — used in Client Components and hooks.
 * Session is persisted in cookies via @supabase/ssr middleware refresh.
 */
export function createClient() {
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey)
}
