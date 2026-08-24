'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import { openCheckout } from '../lib/lemonsqueezy'
import type { Product } from '../lib/types'

type CartItem = {
  product_id: string
  added_at: string
  product?: Product
}

type CartContextValue = {
  items: CartItem[]
  count: number
  loading: boolean
  drawerOpen: boolean
  justAdded: boolean
  openDrawer: () => void
  closeDrawer: () => void
  addToCart: (productId: string) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  isInCart: (productId: string) => boolean
  clearCart: () => Promise<void>
  checkingOut: boolean
  checkoutError: string | null
  checkout: () => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth()
  const { showToast } = useToast()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const load = async () => {
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('cart_items')
      .select('product_id, added_at, product:products(*)')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false })
    const rows = (data as unknown as CartItem[]) ?? []

    // A product that's since been deactivated or deleted comes back as
    // product: null here (RLS only exposes active products) — rather than
    // let a stale row linger and crash the cart UI on missing product data,
    // quietly drop it from both local state and the cart_items table.
    const withProduct = rows.filter((r) => r.product)
    const staleIds = rows.filter((r) => !r.product).map((r) => r.product_id)

    // Free ($0) patterns download directly — they must never sit in the cart
    // (legacy rows from before this rule are stripped on every load).
    const freeIds = withProduct
      .filter((r) => Number(r.product?.price) === 0)
      .map((r) => r.product_id)
    const paid = withProduct.filter((r) => Number(r.product?.price) > 0)

    const dropIds = [...staleIds, ...freeIds]
    if (dropIds.length > 0) {
      await supabase.from('cart_items').delete().eq('user_id', user.id).in('product_id', dropIds)
    }
    if (freeIds.length > 0) {
      showToast(
        freeIds.length === 1
          ? 'A free pattern was removed from your cart — use Download Free on its product page.'
          : 'Free patterns were removed from your cart — use Download Free on each product page.',
        'info',
      )
    }

    setItems(paid)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    // Lemon Squeezy's overlay fires this event when a checkout completes successfully —
    // the webhook clears the DB cart in the background, but nothing else tells our UI
    // to refetch, so without this the cart page/badge would keep showing stale items
    // until the next full page load.
    window.createLemonSqueezy?.()
    window.LemonSqueezy?.Setup?.({
      eventHandler: (event: { event: string }) => {
        if (event.event === 'Checkout.Success') {
          setDrawerOpen(false)
          setTimeout(load, 1500) // small delay so the webhook has time to clear cart_items first
        }
      },
    })
    // Fallback: also refresh whenever the tab regains focus (covers the hosted/new-tab
    // checkout case, where there's no in-page event to listen for at all).
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const openDrawer = () => setDrawerOpen(true)
  const closeDrawer = () => setDrawerOpen(false)

  const addToCart = async (productId: string) => {
    if (!user) return
    const { data: product } = await supabase
      .from('products')
      .select('price')
      .eq('id', productId)
      .maybeSingle()
    if (!product || Number(product.price) === 0) {
      showToast('Free patterns download directly — they can’t be added to cart.', 'info')
      return
    }
    await supabase.from('cart_items').upsert({ user_id: user.id, product_id: productId })
    await load()
    setJustAdded(true)
    setDrawerOpen(true)
    setTimeout(() => setJustAdded(false), 2500)
  }

  const removeFromCart = async (productId: string) => {
    if (!user) return
    await supabase.from('cart_items').delete().eq('user_id', user.id).eq('product_id', productId)
    load()
  }

  const clearCart = async () => {
    if (!user) return
    await supabase.from('cart_items').delete().eq('user_id', user.id)
    setItems([])
  }

  const isInCart = (productId: string) => items.some((i) => i.product_id === productId)

  // Shared by both the /cart page and the drawer — combines every cart item into
  // one Lemon Squeezy checkout (see create-cart-checkout Edge Function).
  const checkout = async () => {
    if (!user || items.length === 0) return
    setCheckoutError(null)
    const freeInCart = items.filter((i) => Number(i.product?.price) === 0)
    if (freeInCart.length > 0) {
      setCheckoutError('Free patterns can’t be checked out — remove them and use Download Free on the product page.')
      return
    }
    setCheckingOut(true)
    const { data, error: fnError } = await supabase.functions.invoke('create-cart-checkout', {
      body: {
        productIds: items.map((i) => i.product_id),
        userId: user.id,
        email: user.email,
        name: [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || undefined,
        billingCountry: profile?.billing_country,
        billingState: profile?.billing_state,
        billingZip: profile?.billing_zip,
      },
    })
    if (fnError || !data?.url) {
      // Try to pull the real reason out of the Edge Function's response body —
      // supabase-js only sets `fnError` (with `data` null) on a non-2xx status,
      // but the function still returns a JSON body with a specific `error`
      // message (e.g. "Missing Lemon Squeezy numeric variant ID for: X",
      // "Could not resolve store/variant from Lemon Squeezy..."). Fall back to
      // the generic message only if we truly can't read a specific one.
      let message = "Couldn't start checkout — please try again in a moment."
      try {
        const context = (fnError as { context?: Response })?.context
        if (context && typeof context.json === 'function') {
          const body = await context.json()
          if (body?.error) message = body.error
        } else if (data?.error) {
          message = data.error
        }
      } catch {
        // context wasn't valid JSON (e.g. a network-level failure) — keep the generic message
      }
      console.error('Cart checkout failed:', fnError, data)
      setCheckoutError(message)
      setCheckingOut(false)
      return
    }
    if (data.hosted) {
      window.open(data.url, '_blank', 'noopener')
    } else {
      openCheckout(data.url)
    }
    setCheckingOut(false)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        count: items.length,
        loading,
        drawerOpen,
        justAdded,
        openDrawer,
        closeDrawer,
        addToCart,
        removeFromCart,
        isInCart,
        clearCart,
        checkingOut,
        checkoutError,
        checkout,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
