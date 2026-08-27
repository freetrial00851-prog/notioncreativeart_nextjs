'use client'

import { AuthProvider } from '@/context/AuthContext'
import { UIProvider } from '@/context/UIContext'
import { CartProvider } from '@/context/CartContext'
import { ToastProvider } from '@/context/ToastContext'
import { PendingActionRunner } from '@/components/PendingActionRunner'
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
            <CartProvider>
              <PendingActionRunner />
              <AdminRedirect />
              <Analytics />
              <TabRestoreIndicator />
              {children}
              <CookieConsent />
            </CartProvider>
          </UIProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
