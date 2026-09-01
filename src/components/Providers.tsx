'use client'

import { Suspense } from 'react'
import { AuthProvider } from '@/context/AuthContext'
import { UIProvider } from '@/context/UIContext'
import { CartProvider } from '@/context/CartContext'
import { WishlistProvider } from '@/context/WishlistContext'
import { ToastProvider } from '@/context/ToastContext'
import { PendingActionRunner } from '@/components/PendingActionRunner'
import { GuestMergeRunner } from '@/components/GuestMergeRunner'
import { AdminRedirect } from '@/components/AdminRedirect'
import { Analytics } from '@/components/Analytics'
import { CookieConsent } from '@/components/CookieConsent'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { TabRestoreIndicator } from '@/components/TabRestoreIndicator'

/**
 * Client-side provider tree — wraps the entire app.
 * Auth, cart, toast, and UI state must live in client context
 * because they depend on browser APIs (sessionStorage, cookies, DOM).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <UIProvider>
            <WishlistProvider>
              <CartProvider>
                <GuestMergeRunner />
                <PendingActionRunner />
                <AdminRedirect />
                <Suspense fallback={null}>
                  <Analytics />
                </Suspense>
                <TabRestoreIndicator />
                {children}
                <CookieConsent />
              </CartProvider>
            </WishlistProvider>
          </UIProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
