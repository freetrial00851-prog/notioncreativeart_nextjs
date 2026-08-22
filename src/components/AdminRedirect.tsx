'use client'

import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

/**
 * Runs once per explicit sign-in (flagged via sessionStorage by
 * signInWithEmail/signInWithGoogle in AuthContext — not on every page
 * load/session restore, so an already-logged-in admin can still browse
 * the customer site normally without being yanked back to /admin).
 */
export function AdminRedirect() {
  const { profile } = useAuth()

  useEffect(() => {
    if (!profile) return
    const intent = sessionStorage.getItem('nca_signin_intent')
    if (!intent) return
    sessionStorage.removeItem('nca_signin_intent')
    if (profile.is_admin && !window.location.pathname.startsWith('/admin')) {
      window.location.href = '/admin'
    }
  }, [profile])

  return null
}
