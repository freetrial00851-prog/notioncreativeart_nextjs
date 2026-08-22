'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

/**
 * Mounted inside the customer-facing shell (not /admin/*). Unlike
 * AdminRedirect (which only fires once, right after a fresh sign-in),
 * this runs on every route change — so an admin can't reach any
 * customer-facing page at all, whether by typing a URL, clicking an
 * old bookmark, or navigating back. Non-admins and logged-out visitors
 * are completely unaffected.
 */
const EXEMPT_PATHS = ['/login', '/signup', '/reset-password']

export function AdminAreaGuard() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading || !profile?.is_admin || !pathname) return
    if (EXEMPT_PATHS.some((p) => pathname.startsWith(p))) return
    router.replace('/admin')
  }, [loading, profile?.is_admin, pathname, router])

  return null
}
