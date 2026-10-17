'use client'

import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { SPRING_DEFAULT, SPRING_FLICK, VelocityTracker, createSpring, prefersReducedMotion, project, type Spring } from './spring'

const HYSTERESIS = 10 // px before a drag commits to a direction
const FLICK_SPEED = 300 // px/s — above this the SIGN of velocity decides, not the position

/**
 * Pointer-driven carousel for a single visible slide.
 *
 * - 1:1 tracking: the slide follows the finger and keeps the grab offset
 *   (Pointer Events + `setPointerCapture`).
 * - A small movement threshold (~10px) before committing to horizontal.
 * - On release: velocity decides (sign), momentum is projected, and the spring
 *   continues at the finger's exact velocity (no seam).
 * - Interruptible: grabbing mid-animation starts from the live position.
 * - `prefers-reduced-motion`: no sliding — the index just changes.
 *
 * Attach `handlers` + `containerRef` to the viewport, and `slideRef` to the
 * element that should move. Needs `touch-action: pan-y` on the viewport.
 */
export function useSwipeCarousel({ count, onNext, onPrev }: { count: number; onNext: () => void; onPrev: () => void }) {
  const slideRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const springRef = useRef<Spring | null>(null)
  const drag = useRef<{ id: number; x0: number; y0: number; startPos: number; committed: boolean; locked: 'x' | 'y' | null } | null>(null)
  const tracker = useRef(new VelocityTracker())
  const cbs = useRef({ onNext, onPrev })
  useEffect(() => {
    cbs.current = { onNext, onPrev }
  })

  useEffect(() => {
    const spring = createSpring(0, (v) => {
      const el = slideRef.current
      if (el) el.style.transform = v === 0 ? '' : `translate3d(${v}px,0,0)`
    })
    springRef.current = spring
    return () => spring.stop()
  }, [])

  const width = () => containerRef.current?.getBoundingClientRect().width ?? 320

  /** Slide the current photo out, swap the index, bring the new one in from the other side. */
  const commit = useCallback((dir: 1 | -1, velocity = 0, fromFlick = false) => {
    const spring = springRef.current
    if (!spring) return
    const w = width()
    const swap = () => (dir === 1 ? cbs.current.onNext() : cbs.current.onPrev())
    if (prefersReducedMotion()) {
      spring.set(0)
      swap()
      return
    }
    spring.to(-dir * w, {
      velocity,
      config: fromFlick ? SPRING_FLICK : SPRING_DEFAULT,
      onComplete: () => {
        swap()
        spring.set(dir * w * 0.35)
        spring.to(0, { config: SPRING_DEFAULT })
      },
    })
  }, [])

  const settle = useCallback((velocity = 0, fromFlick = false) => {
    springRef.current?.to(0, { velocity, config: fromFlick ? SPRING_FLICK : SPRING_DEFAULT })
  }, [])

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (count < 2 || (e.pointerType === 'mouse' && e.button !== 0)) return
    const spring = springRef.current
    // Interrupt: stop where the photo is right now.
    const startPos = spring?.value ?? 0
    spring?.stop()
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, startPos, committed: false, locked: null }
    tracker.current.reset(e.clientX)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x0
    const dy = e.clientY - d.y0
    if (!d.locked) {
      if (Math.hypot(dx, dy) < HYSTERESIS) return
      d.locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (d.locked === 'x') {
        e.currentTarget.setPointerCapture(e.pointerId)
        d.committed = true
      } else {
        drag.current = null
        return
      }
    }
    if (!d.committed) return
    // 1:1, minus the hysteresis so the photo does not jump when the drag commits.
    const offset = dx - Math.sign(dx) * HYSTERESIS
    tracker.current.push(e.clientX)
    springRef.current?.set(d.startPos + offset)
  }

  const end = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    if (!d.committed) return
    const spring = springRef.current
    if (!spring) return
    const v = tracker.current.velocity()
    const pos = spring.value
    const flick = Math.abs(v) > FLICK_SPEED
    // Velocity sign decides reverse-vs-commit; otherwise position.
    let dir: 1 | -1 | 0 = 0
    if (flick) dir = v < 0 ? 1 : -1
    else if (Math.abs(pos + project(v)) > width() * 0.33) dir = pos < 0 ? 1 : -1
    if (dir === 0) settle(v, flick)
    else commit(dir, v, flick)
  }

  return {
    containerRef,
    slideRef,
    /** Programmatic next/prev (arrow buttons) — same motion as a swipe. */
    go: (dir: 1 | -1) => commit(dir),
    handlers: { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end },
  }
}
