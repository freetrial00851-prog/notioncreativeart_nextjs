'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MaterialIcon } from '@/components/MaterialIcon'
import { PRIMARY_PILL, SECONDARY_PILL } from '@/components/account/AccountUI'
import type { NotFoundChip } from '@/lib/data/notFoundChips'

export function NotFound({ chips = [] }: { chips?: NotFoundChip[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function onSearch(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  return (
    <div className="relative max-w-site mx-auto px-5 md:px-10 lg:px-8 py-20 md:py-28 text-center overflow-hidden">
      <p
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-6 md:top-8 -translate-x-1/2 font-heading text-[140px] md:text-[220px] leading-none font-bold text-primary-soft select-none"
      >
        404
      </p>
      <div className="relative">
        <h1 className="font-heading text-[36px] md:text-[48px] leading-[1.1] font-bold text-ink">This page wandered off</h1>
        <p className="mt-4 mx-auto max-w-md text-[16px] leading-relaxed text-muted">
          The link may be old or mistyped. Search for a pattern, or start from one of these.
        </p>

        <form onSubmit={onSearch} className="mt-8 mx-auto max-w-md">
          <label className="sr-only" htmlFor="not-found-search">
            Search patterns
          </label>
          <div className="relative">
            <MaterialIcon
              name="search"
              size={18}
              color="var(--color-muted)"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
            />
            <input
              id="not-found-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patterns"
              className="w-full min-h-12 rounded-full border border-border bg-white pl-11 pr-4 text-[16px] text-ink placeholder:text-muted-light focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </div>
        </form>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/shop" className={`${PRIMARY_PILL} min-h-12 px-7`}>
            Shop all patterns
          </Link>
          <Link href="/" className={`${SECONDARY_PILL} min-h-12 px-7`}>
            Back to home
          </Link>
        </div>

        {chips.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {chips.map((chip) => (
              <Link
                key={chip.href}
                href={chip.href}
                className="inline-flex min-h-11 items-center rounded-full border border-border bg-white px-4 text-[14px] font-semibold text-ink hover:bg-surface-warm"
              >
                {chip.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
