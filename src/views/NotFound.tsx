'use client'

import Link from 'next/link'
import { Logo } from '../components/Logo'
import { Button } from '../components/ui/Button'

const QUICK = [
  { label: 'Amigurumi', href: '/shop/amigurumi' },
  { label: 'Wearables', href: '/shop/wearables' },
  { label: 'Home decor', href: '/shop/home-decor' },
  { label: 'Free patterns', href: '/shop?price=free' },
]

export function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <div className="flex h-16 items-center justify-center border-b border-border">
        <Logo variant="full" />
      </div>
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-5 py-16 text-center">
        <p
          aria-hidden
          className="pointer-events-none absolute inset-0 flex select-none items-center justify-center font-heading lining-nums text-[48vw] font-bold leading-none text-primary-soft md:text-[28vw]"
        >
          404
        </p>
        <div className="relative w-full max-w-md">
          <h1 className="type-h1 mb-3 text-ink">This page wandered off</h1>
          <p className="mb-7 text-[15px] leading-relaxed text-muted">
            The link may be old or mistyped. Search for a pattern, or start from one of these.
          </p>
          <form action="/search" method="get" role="search" className="mb-6">
            <label htmlFor="nf-search" className="sr-only">
              Search patterns
            </label>
            <input
              id="nf-search"
              name="q"
              type="search"
              placeholder="Search patterns"
              className="block min-h-12 w-full rounded-full border border-border bg-surface px-5 text-[16px] text-ink placeholder:text-muted-light focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
          </form>
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/shop" className="sm:flex-1">
              <Button variant="primary" size="lg" className="w-full">
                Shop all patterns
              </Button>
            </Link>
            <Link href="/" className="sm:flex-1">
              <Button variant="secondary" size="lg" className="w-full">
                Back to home
              </Button>
            </Link>
          </div>
          <ul className="flex flex-wrap justify-center gap-2">
            {QUICK.map((q) => (
              <li key={q.href}>
                <Link
                  href={q.href}
                  className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 text-[13px] font-medium text-ink hover:bg-surface-warm"
                >
                  {q.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
