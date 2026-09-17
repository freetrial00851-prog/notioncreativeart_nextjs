'use client'

import { Suspense } from 'react'
import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/context/AuthContext'
import { UIProvider } from '@/context/UIContext'
import { CartProvider } from '@/context/CartContext'
import { WishlistProvider } from '@/context/WishlistContext'
import { ToastProvider } from '@/context/ToastContext'
import { PendingActionRunner } from '@/components/PendingActionRunner'
import { GuestMergeRunner } from '@/components/GuestMergeRunner'
import { AdminRedirect } from '@/components/AdminRedirect'
import { Analytics } from '@/components/Analytics'
import { PinterestTag } from '@/components/PinterestTag'
import { CookieConsent } from '@/components/CookieConsent'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { TabRestoreIndicator } from '@/components/TabRestoreIndicator'

/**
 * Resets the error UI when the App Router pathname changes (e.g. browser Back)
 * without remounting providers via a key (which would wipe auth/cart state).
 */
function RouteAwareErrorBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>
}

/**
 * Client-side provider tree — wraps the entire app.
 * Auth, cart, toast, and UI state must live in client context
 * because they depend on browser APIs (sessionStorage, cookies, DOM).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <RouteAwareErrorBoundary>
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
                  <PinterestTag />
                </Suspense>
                <TabRestoreIndicator />
                {children}
                <CookieConsent />
              </CartProvider>
            </WishlistProvider>
          </UIProvider>
        </ToastProvider>
      </AuthProvider>
    </RouteAwareErrorBoundary>
  )
}
