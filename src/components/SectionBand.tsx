import type { CSSProperties, ReactNode } from 'react'

/** Even index → background (#FCFBF8), odd → surface (#F8F4ED). */
export function sectionBandStyle(index: number): CSSProperties {
  return {
    background: index % 2 === 0 ? 'var(--color-background)' : 'var(--color-surface)',
  }
}

/**
 * Full-bleed section band: alternating background + balanced vertical padding.
 * Both top and bottom are set so content never sits flush on a color edge.
 * Values are half the target gap so adjacent bands stack to ~24–28px mobile
 * and ~32–40px desktop between sections (not ~150px).
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
  // Per side: mobile 12–14px, desktop 16–20px → stacked gap ~24–28 / ~32–40.
  const padY = compact ? 'py-3 md:py-4' : 'py-3.5 md:py-5'

  return (
    <section
      className={`w-full ${padY} ${className}`}
      style={sectionBandStyle(index)}
    >
      <div className={`max-w-site px-6 md:px-16 xl:px-24 2xl:px-32 ${innerClassName}`}>
        {children}
      </div>
    </section>
  )
}
