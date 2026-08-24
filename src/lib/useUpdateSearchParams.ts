'use client'

import { useCallback, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

/**
 * Next.js replacement for react-router's [searchParams, setSearchParams].
 * Updates the query string via a concurrent transition so the previous UI
 * stays visible until the next route payload is ready.
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

  return [searchParams, setSearchParams, isPending] as const
}
