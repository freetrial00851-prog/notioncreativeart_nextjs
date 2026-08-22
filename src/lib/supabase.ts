'use client'

import { createClient } from '@/lib/supabase/client'

/**
 * Singleton browser Supabase client — drop-in replacement for the Vite `supabase` export.
 * All existing components import from here unchanged.
 */
export const supabase = createClient()
