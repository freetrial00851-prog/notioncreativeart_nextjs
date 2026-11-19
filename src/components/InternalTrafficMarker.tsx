'use client'

import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { markInternalAdmin, syncInternalFromUrl } from '@/lib/internalTraffic'

/** Renders nothing. Must sit before the analytics components so the flag is set before they decide to load. */
export function InternalTrafficMarker() {
  const { profile } = useAuth()

  useEffect(() => {
    syncInternalFromUrl()
  }, [])

  useEffect(() => {
    if (profile?.is_admin) markInternalAdmin()
  }, [profile?.is_admin])

  return null
}
