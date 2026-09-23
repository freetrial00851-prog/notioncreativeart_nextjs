import type { CSSProperties, ReactNode } from 'react'

/** Even index → white canvas, odd → light neutral surface. */
export function sectionBandStyle(index: number): CSSProperties {
  return {
    background: index % 2 === 0 ? 'var(--color-background)' : 'var(--color-surface)',
  }
}

/**
 * Full-bleed section band: alternating background + consistent vertical padding.
 * Standard scale: py-10 mobile / py-14 desktop (compact strips use py-6 / py-8).
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
  const padY = compact ? 'py-6 md:py-8' : 'py-10 md:py-14'

  return (
    <section
      className={`w-full ${padY} ${className}`}
      style={sectionBandStyle(index)}
    >
      <div className={`max-w-site px-4 md:px-16 xl:px-24 2xl:px-32 ${innerClassName}`}>
        {children}
      </div>
    </section>
  )
}
