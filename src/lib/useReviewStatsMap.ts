import { useEffect, useState } from 'react'
import type { Product, ReviewStats } from './types'
import { fetchReviewStatsBatch } from './reviews'

function productIdsKey(products: Product[]): string {
  return products.map((p) => p.id).join(',')
}

/** Batch-fetch review stats for a list of products (one RPC per unique ID set). */
export function useReviewStatsMap(products: Product[]): Map<string, ReviewStats> {
  const [map, setMap] = useState<Map<string, ReviewStats>>(new Map())
  const idsKey = productIdsKey(products)

  useEffect(() => {
    const ids = idsKey ? idsKey.split(',') : []
    if (ids.length === 0) {
      setMap(new Map())
      return
    }
    let cancelled = false
    fetchReviewStatsBatch(ids).then((next) => {
      if (!cancelled) setMap(next)
    })
    return () => {
      cancelled = true
    }
  }, [idsKey])

  return map
}

/** Merge stats for multiple product lists (e.g. homepage sections). */
export function useReviewStatsMapForLists(lists: Product[][]): Map<string, ReviewStats> {
  const merged = lists.flat()
  const seen = new Set<string>()
  const unique: Product[] = []
  for (const p of merged) {
    if (!seen.has(p.id)) {
      seen.add(p.id)
      unique.push(p)
    }
  }
  return useReviewStatsMap(unique)
}
