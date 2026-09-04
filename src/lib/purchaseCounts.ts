import type { Product } from './types'
import { supabase } from './supabase'

/** Paid-only purchase counts for Best Selling sort (order_id IS NOT NULL). */
export async function fetchPaidPurchaseCounts(
  productIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  if (productIds.length === 0) return map

  const { data, error } = await supabase.rpc('get_purchase_counts_batch', {
    p_product_ids: productIds,
    p_paid_only: true,
  })

  if (error) {
    console.warn('get_purchase_counts_batch failed:', error.message)
    return map
  }

  for (const row of (data ?? []) as Array<{ product_id: string; purchase_count: number | string }>) {
    map.set(row.product_id, Number(row.purchase_count) || 0)
  }
  return map
}
