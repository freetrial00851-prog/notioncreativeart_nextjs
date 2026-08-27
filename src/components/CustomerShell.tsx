'use client'

import { useEffect } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { GlobalAccountBanners } from '@/components/GlobalAccountBanners'
import { AdminAreaGuard } from '@/components/AdminAreaGuard'
import { CartDrawer } from '@/components/CartDrawer'
import { CheckoutOverlay } from '@/components/CheckoutOverlay'
import { SupportChat } from '@/components/SupportChat'
import { AuthSheet } from '@/components/AuthSheet'
import { NewsletterPromptModal } from '@/components/NewsletterPromptModal'
import { useUI } from '@/context/UIContext'
import { ScrollToTop } from '@/components/ScrollToTop'

/**
 * Customer-facing shell — header, footer, cart drawer, auth sheet.
 * Admin routes use their own layout without this shell.
 */
function NewsletterPromptHost() {
  const { newsletterPromptOpen, closeNewsletterPrompt } = useUI()
  return <NewsletterPromptModal open={newsletterPromptOpen} onClose={closeNewsletterPrompt} />
}

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
      <CheckoutOverlay />
      <SupportChat />
      <AuthSheet />
      <NewsletterPromptHost />
      <div className="min-h-screen flex flex-col">
        <Header />
        <GlobalAccountBanners />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </>
  )
}
