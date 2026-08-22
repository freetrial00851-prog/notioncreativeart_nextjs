'use client'

import { useEffect } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { CompleteAccountBanner } from '@/components/CompleteAccountBanner'
import { AdminAreaGuard } from '@/components/AdminAreaGuard'
import { CartDrawer } from '@/components/CartDrawer'
import { AuthSheet } from '@/components/AuthSheet'
import { ScrollToTop } from '@/components/ScrollToTop'

/**
 * Customer-facing shell — header, footer, cart drawer, auth sheet.
 * Admin routes use their own layout without this shell.
 */
export function CustomerShell({ children }: { children: React.ReactNode }) {
  // Lemon Squeezy checkout overlay — same as the Vite app's useEffect in App.tsx
  useEffect(() => {
    window.createLemonSqueezy?.()
  }, [])

  return (
    <>
      <ScrollToTop />
      <AdminAreaGuard />
      <CartDrawer />
      <AuthSheet />
      <div className="min-h-screen flex flex-col">
        <Header />
        <CompleteAccountBanner />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </>
  )
}
