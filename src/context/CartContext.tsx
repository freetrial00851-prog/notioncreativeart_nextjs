'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import { startApiCheckout } from '../lib/lemonsqueezy'
import { profileDisplayName } from '../lib/profileName'
import {
  GUEST_MERGE_DONE_EVENT,
  RUN_PENDING_CHECKOUT_EVENT,
  addGuestCartItem,
  clearGuestCart,
  readGuestCart,
  removeGuestCartItem,
  writeGuestCart,
} from '../lib/guestStorage'
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
  /** Requires an authenticated user. Guests should call requireAuth + setPendingCheckout first. */
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
  const itemsRef = useRef(items)
  itemsRef.current = items

  const loadGuest = useCallback(async () => {
    setLoading(true)
    const guest = readGuestCart()
    if (guest.length === 0) {
      setItems([])
      setLoading(false)
      return
    }
    const ids = guest.map((g) => g.productId)
    const { data } = await supabase
      .from('products')
      .select('*')
      .in('id', ids)
      .eq('active', true)
    const byId = new Map((data as Product[] | null)?.map((p) => [p.id, p]) ?? [])
    const paid: CartItem[] = []
    const dropGuest: string[] = []
    for (const g of guest) {
      const product = byId.get(g.productId)
      if (!product || Number(product.price) === 0) {
        dropGuest.push(g.productId)
        continue
      }
      paid.push({
        product_id: g.productId,
        added_at: new Date().toISOString(),
        product,
      })
    }
    if (dropGuest.length > 0) {
      writeGuestCart(guest.filter((g) => !dropGuest.includes(g.productId)))
      if (dropGuest.some((id) => Number(byId.get(id)?.price) === 0)) {
        showToast('Free patterns download directly — they can’t be added to cart.', 'info')
      }
    }
    setItems(paid)
    setLoading(false)
  }, [showToast])

  const loadAccount = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('cart_items')
      .select('product_id, added_at, product:products(*)')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false })
    const rows = (data as unknown as CartItem[]) ?? []

    const withProduct = rows.filter((r) => r.product)
    const staleIds = rows.filter((r) => !r.product).map((r) => r.product_id)

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
  }, [user, showToast])

  const load = useCallback(async () => {
    if (!user) await loadGuest()
    else await loadAccount()
  }, [user, loadGuest, loadAccount])

  useEffect(() => {
    void load()
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onMerge = () => {
      void load()
    }
    window.addEventListener(GUEST_MERGE_DONE_EVENT, onMerge)
    return () => window.removeEventListener(GUEST_MERGE_DONE_EVENT, onMerge)
  }, [load])

  useEffect(() => {
    window.createLemonSqueezy?.()
    window.LemonSqueezy?.Setup?.({
      eventHandler: (event: { event: string }) => {
        if (event.event === 'Checkout.Success') {
          setDrawerOpen(false)
          setTimeout(() => void load(), 1500)
        }
      },
    })
    const onFocus = () => {
      if (user) void load()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [user?.id, user, load])

  const openDrawer = () => setDrawerOpen(true)
  const closeDrawer = () => setDrawerOpen(false)

  const addToCart = async (productId: string) => {
    const { data: product } = await supabase
      .from('products')
      .select('price')
      .eq('id', productId)
      .maybeSingle()
    if (!product || Number(product.price) === 0) {
      showToast('Free patterns download directly — they can’t be added to cart.', 'info')
      return
    }

    if (!user) {
      addGuestCartItem(productId)
      await loadGuest()
      setJustAdded(true)
      setDrawerOpen(true)
      setTimeout(() => setJustAdded(false), 2500)
      return
    }

    await supabase.from('cart_items').upsert(
      { user_id: user.id, product_id: productId, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,product_id' },
    )
    await loadAccount()
    setJustAdded(true)
    setDrawerOpen(true)
    setTimeout(() => setJustAdded(false), 2500)
  }

  const removeFromCart = async (productId: string) => {
    if (!user) {
      removeGuestCartItem(productId)
      await loadGuest()
      return
    }
    await supabase.from('cart_items').delete().eq('user_id', user.id).eq('product_id', productId)
    await loadAccount()
  }

  const clearCart = async () => {
    if (!user) {
      clearGuestCart()
      setItems([])
      return
    }
    await supabase.from('cart_items').delete().eq('user_id', user.id)
    setItems([])
  }

  const isInCart = (productId: string) => items.some((i) => i.product_id === productId)

  const checkout = async () => {
    if (!user || itemsRef.current.length === 0) return
    setCheckoutError(null)
    const current = itemsRef.current
    const freeInCart = current.filter((i) => Number(i.product?.price) === 0)
    if (freeInCart.length > 0) {
      setCheckoutError('Free patterns can’t be checked out — remove them and use Download Free on the product page.')
      return
    }
    setCheckingOut(true)
    const result = await startApiCheckout(
      current.map((i) => i.product_id),
      {
        userId: user.id,
        email: user.email,
        name: profileDisplayName(profile) || undefined,
        billingCountry: profile?.billing_country,
        billingState: profile?.billing_state,
        billingZip: profile?.billing_zip,
      },
    )
    if (!result.ok) setCheckoutError(result.error)
    setCheckingOut(false)
  }

  useEffect(() => {
    const onPendingCheckout = () => {
      // Allow cart reload from merge to settle, then checkout.
      setTimeout(() => {
        void checkout()
      }, 400)
    }
    window.addEventListener(RUN_PENDING_CHECKOUT_EVENT, onPendingCheckout)
    return () => window.removeEventListener(RUN_PENDING_CHECKOUT_EVENT, onPendingCheckout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile])

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
