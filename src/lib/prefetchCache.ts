import { supabase } from './supabase'
import type { Product } from './types'

const cache = new Map<string, Promise<Product | null>>()

export function prefetchProduct(slug: string) {
  if (cache.has(slug)) return
  const promise: Promise<Product | null> = Promise.resolve(
    supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .eq('active', true)
      .single()
      .then(({ data }) => (data as Product | null))
  )
  cache.set(slug, promise)
}

export function getPrefetchedProduct(slug: string): Promise<Product | null> | undefined {
  return cache.get(slug)
}
