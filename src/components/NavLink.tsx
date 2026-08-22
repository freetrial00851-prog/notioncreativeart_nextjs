'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentProps, ReactNode } from 'react'

type NavLinkProps = Omit<ComponentProps<typeof Link>, 'className'> & {
  /** When true, only exact pathname match counts as active (like react-router `end`). */
  end?: boolean
  className?: string | ((props: { isActive: boolean }) => string)
  children: ReactNode
}

/**
 * Next.js-compatible NavLink — drop-in for react-router-dom NavLink.
 * Uses pathname matching with optional exact (`end`) mode.
 */
export function NavLink({ href, end, className, children, ...rest }: NavLinkProps) {
  const pathname = usePathname()
  const hrefStr = typeof href === 'string' ? href : (href.pathname ?? '/')
  const currentPath = pathname ?? ''
  const isActive = end
    ? currentPath === hrefStr
    : currentPath === hrefStr || currentPath.startsWith(hrefStr + '/')

  const resolvedClass =
    typeof className === 'function' ? className({ isActive }) : className

  return (
    <Link href={href} className={resolvedClass} {...rest}>
      {children}
    </Link>
  )
}
