'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import {
  GUEST_MERGE_DONE_EVENT,
  readGuestWishlistIds,
  toggleGuestWishlistId,
} from '../lib/guestStorage'
import type { Product } from '../lib/types'

type WishlistContextValue = {
  /** True once guest/auth wishlist ids have been read for the current auth state. */
  ready: boolean
  productIds: string[]
  isWishlisted: (productId: string) => boolean
  toggleWishlist: (productId: string) => Promise<{ added: boolean }>
  /** Full product rows for the wishlist page (active products only). */
  products: Product[]
  productsLoading: boolean
  refresh: () => Promise<void>
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [productIds, setProductIds] = useState<string[]>([])
  const [ready, setReady] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)

  const loadProductsForIds = useCallback(async (ids: string[]) => {
    if (ids.length === 0) {
      setProducts([])
      setProductsLoading(false)
      return
    }
    setProductsLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .in('id', ids)
      .eq('active', true)
    const byId = new Map((data as Product[] | null)?.map((p) => [p.id, p]) ?? [])
    // Preserve wishlist order (most recently added last in guest store; account order from query).
    setProducts(ids.map((id) => byId.get(id)).filter(Boolean) as Product[])
    setProductsLoading(false)
  }, [])

  const refresh = useCallback(async () => {
    if (!user) {
      const ids = readGuestWishlistIds()
      setProductIds(ids)
      setReady(true)
      await loadProductsForIds(ids)
      return
    }
    const { data } = await supabase
      .from('wishlist')
      .select('product_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    const ids = (data ?? []).map((r) => r.product_id as string)
    setProductIds(ids)
    setReady(true)
    await loadProductsForIds(ids)
  }, [user, loadProductsForIds])

  useEffect(() => {
    setReady(false)
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    const onMerge = () => {
      void refresh()
    }
    window.addEventListener(GUEST_MERGE_DONE_EVENT, onMerge)
    return () => window.removeEventListener(GUEST_MERGE_DONE_EVENT, onMerge)
  }, [refresh])

  const isWishlisted = useCallback(
    (productId: string) => productIds.includes(productId),
    [productIds],
  )

  const toggleWishlist = useCallback(
    async (productId: string) => {
      if (!user) {
        const { ids, added } = toggleGuestWishlistId(productId)
        setProductIds(ids)
        await loadProductsForIds(ids)
        return { added }
      }

      const currently = productIds.includes(productId)
      if (currently) {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId)
        if (error) {
          console.error('[wishlist] remove failed', error)
          showToast('Couldn’t update wishlist — try again.', 'error')
          return { added: true }
        }
        const next = productIds.filter((id) => id !== productId)
        setProductIds(next)
        await loadProductsForIds(next)
        return { added: false }
      }

      const { error } = await supabase
        .from('wishlist')
        .upsert({ user_id: user.id, product_id: productId })
      if (error) {
        console.error('[wishlist] add failed', error)
        showToast('Couldn’t update wishlist — try again.', 'error')
        return { added: false }
      }
      const next = [productId, ...productIds.filter((id) => id !== productId)]
      setProductIds(next)
      await loadProductsForIds(next)
      return { added: true }
    },
    [user, productIds, loadProductsForIds, showToast],
  )

  return (
    <WishlistContext.Provider
      value={{
        ready,
        productIds,
        isWishlisted,
        toggleWishlist,
        products,
        productsLoading,
        refresh,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
