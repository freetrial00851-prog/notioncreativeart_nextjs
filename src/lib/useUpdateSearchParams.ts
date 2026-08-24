'use client'

import { useCallback, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

/**
 * Next.js replacement for react-router's [searchParams, setSearchParams].
 * Updates the query string via a concurrent transition so RSC work does not
 * block input. Callers should refetch listing data on the client immediately
 * rather than waiting for `isPending` / the server payload.
 */
export function useUpdateSearchParams() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const setSearchParams = useCallback(
    (mutate: (params: URLSearchParams) => URLSearchParams | void) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '')
      const result = mutate(params)
      const next = result ?? params
      const qs = next.toString()
      startTransition(() => {
        router.push(qs ? `${pathname ?? '/'}?${qs}` : (pathname ?? '/'), { scroll: false })
      })
    },
    [searchParams, router, pathname, startTransition],
  )

  /** Build the next query string without navigating — for optimistic client fetches. */
  const peekSearchParams = useCallback(
    (mutate: (params: URLSearchParams) => URLSearchParams | void) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '')
      const result = mutate(params)
      return result ?? params
    },
    [searchParams],
  )

  return [searchParams, setSearchParams, isPending, peekSearchParams] as const
}
