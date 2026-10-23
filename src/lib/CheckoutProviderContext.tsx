'use client'

import { createContext, useContext, type ReactNode } from 'react'

export type SiteCheckoutProvider = 'lemonsqueezy' | 'paddle'

const Ctx = createContext<SiteCheckoutProvider>('lemonsqueezy')

/** The shop-wide payment provider, read on the server in the root layout so the first HTML already names the right one. */
export function CheckoutProviderContext({ initial, children }: { initial: SiteCheckoutProvider; children: ReactNode }) {
  return <Ctx.Provider value={initial}>{children}</Ctx.Provider>
}

export function useSiteCheckoutProvider() {
  return useContext(Ctx)
}
