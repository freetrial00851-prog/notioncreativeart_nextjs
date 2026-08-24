import type { CSSProperties, ReactNode } from 'react'

/** Even index → background (#FCFBF8), odd → surface (#F8F4ED). */
export function sectionBandStyle(index: number): CSSProperties {
  return {
    background: index % 2 === 0 ? 'var(--color-background)' : 'var(--color-surface)',
  }
}

/**
 * Full-bleed section band: alternating background + one-sided vertical padding.
 * Only padding-top separates adjacent bands (so gaps don't double). Last band
 * also gets padding-bottom so the page doesn't sit flush against the footer.
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
  // Mobile ~32–40px, desktop ~48–64px between sections (pt only).
  const padY = compact
    ? 'pt-6 md:pt-10 last:pb-8 md:last:pb-12'
    : 'pt-8 md:pt-14 last:pb-10 md:last:pb-16'

  return (
    <section
      className={`w-full ${padY} ${className}`}
      style={sectionBandStyle(index)}
    >
      <div className={`max-w-site px-6 md:px-16 ${innerClassName}`}>
        {children}
      </div>
    </section>
  )
}
