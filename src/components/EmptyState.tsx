'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { MaterialIcon } from './MaterialIcon'

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  actionTo,
  children,
  afterAction,
}: {
  icon: string
  title: string
  subtitle: string
  actionLabel: string
  actionTo: string
  children?: ReactNode
  /** Optional control rendered below the primary action (e.g. a secondary button). */
  afterAction?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: 'var(--color-surface)' }}>
        <MaterialIcon name={icon} size={28} color="var(--color-ink-soft)" />
      </div>
      <p className="font-subheading text-2xl font-semibold mb-2">{title}</p>
      <p className="text-[13px] text-ink-soft mb-6 max-w-xs leading-relaxed">{subtitle}</p>
      <Link
        href={actionTo}
        className="px-6 py-3 rounded-lg text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
        style={{ background: 'var(--color-sale-green)' }}
      >
        {actionLabel}
      </Link>
      {afterAction && <div className="mt-4">{afterAction}</div>}
      {children && <div className="w-full mt-14 text-left">{children}</div>}
    </div>
  )
}
