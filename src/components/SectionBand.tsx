import type { CSSProperties, ReactNode } from 'react'

/** Even index → background (#FCFBF8), odd → surface (#F8F4ED). */
export function sectionBandStyle(index: number): CSSProperties {
  return {
    background: index % 2 === 0 ? 'var(--color-background)' : 'var(--color-surface)',
  }
}

/**
 * Full-bleed section band: alternating background + generous vertical padding.
 * Inner content is constrained to max-w-site. Use index from the *rendered*
 * section list (skip null/hidden) so Admin reorder/visibility never leaves
 * two adjacent bands the same color.
 */
export function SectionBand({
  index,
  children,
  className = '',
  innerClassName = '',
  /** Tighter padding for compact strips (e.g. trust). */
  compact = false,
}: {
  index: number
  children: ReactNode
  className?: string
  innerClassName?: string
  compact?: boolean
}) {
  return (
    <section
      className={`w-full ${compact ? 'py-10 md:py-16' : 'py-14 md:py-24'} ${className}`}
      style={sectionBandStyle(index)}
    >
      <div className={`max-w-site px-6 md:px-16 ${innerClassName}`}>
        {children}
      </div>
    </section>
  )
}
