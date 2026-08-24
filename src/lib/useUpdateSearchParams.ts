'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

/**
 * Next.js replacement for react-router's [searchParams, setSearchParams].
 * Mutates URL query string via router.push — preserves pathname.
 */
export function useUpdateSearchParams() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const setSearchParams = useCallback(
    (mutate: (params: URLSearchParams) => URLSearchParams | void) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '')
      const result = mutate(params)
      const next = result ?? params
      const qs = next.toString()
      router.push(qs ? `${pathname ?? '/'}?${qs}` : (pathname ?? '/'), { scroll: false })
    },
    [searchParams, router, pathname],
  )

  return [searchParams, setSearchParams] as const
}
