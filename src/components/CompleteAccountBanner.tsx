'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { isBillingAddressComplete } from '../lib/billingAddress'

export function CompleteAccountBanner() {
  const { user, profile, loading } = useAuth()
  const pathname = usePathname()

  if (loading || !user || !profile) return null
  if (isBillingAddressComplete(profile)) return null
  // Don't nag the user while they're already on the page that fixes this.
  if (pathname === '/account/profile' || pathname === '/account/addresses') return null

  return (
    <Link
      href="/account/profile?tab=addresses"
      className="block border-b border-line text-center px-4 py-2.5 text-[12px] tracking-[0.02em] hover:opacity-90 transition-opacity text-white"
      style={{ background: '#7A1F2B' }}
    >
      <span className="font-semibold">Complete your account</span>
      <span className="text-white/80"> — add your billing address so checkout can fill it in automatically. </span>
      <span className="underline underline-offset-2 font-medium">Add address →</span>
    </Link>
  )
}
