'use client'

import { Children, useEffect, useRef, useState, type ReactNode } from 'react'
import { HOME_PRODUCT_GRID_MIN_PX } from '../lib/homeProductGrid'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * One product row that fits as many equal-width cards as the container allows.
 * Card min width matches Featured Items; leftover space is shared so cards grow
 * evenly. Never wraps, never scrolls horizontally.
 */
export function HomeProductRow({ children, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const items = Children.toArray(children)
  const total = items.length
  const [visible, setVisible] = useState(total)

  useEffect(() => {
    const el = ref.current
    if (!el || total === 0) return

    const measure = () => {
      const styles = getComputedStyle(el)
      const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0
      const width = el.clientWidth
      // Prefer the Featured card size; on narrow phones allow a slightly smaller
      // floor so two equal cards fit instead of one stretched full-width card.
      const minPx = width < 480 ? 150 : HOME_PRODUCT_GRID_MIN_PX
      const fit = Math.max(1, Math.floor((width + gap) / (minPx + gap)))
      setVisible(Math.min(fit, total))
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [total])

  const cols = Math.max(1, Math.min(visible, total))

  return (
    <div
      ref={ref}
      className={`grid w-full gap-x-6 lg:gap-x-8 ${className}`.trim()}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {items.slice(0, cols)}
    </div>
  )
}
