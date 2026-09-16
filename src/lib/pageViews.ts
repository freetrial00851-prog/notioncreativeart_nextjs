'use client'

import { supabase } from '@/lib/supabase'

const MAX_PATH_LENGTH = 512

function normalizeStorefrontPath(path: string): string | null {
  const normalized = (path.split('?')[0] || '/').trim() || '/'
  if (normalized.length > MAX_PATH_LENGTH) return null
  if (!normalized.startsWith('/')) return null
  if (normalized === '/admin' || normalized.startsWith('/admin/')) return null
  return normalized
}

/** Best-effort storefront page view. Never throws; failures are ignored. */
export function recordPageView(path: string): void {
  try {
    const normalized = normalizeStorefrontPath(path)
    if (!normalized) return
    void supabase.from('page_views').insert({ path: normalized }).then(
      () => undefined,
      () => undefined,
    )
  } catch {
    // Storefront UX must not break if analytics is unavailable.
  }
}
