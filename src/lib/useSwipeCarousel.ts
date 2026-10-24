'use client'

import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { flushSync } from 'react-dom'
import { VelocityTracker, createSpring, prefersReducedMotion, project, type Spring } from './spring'

const HYSTERESIS = 10 // px before a drag commits to a direction
const FLICK_SPEED = 300 // px/s — above this the SIGN of velocity decides, not the position
const COMMIT_FRACTION = 0.25 // of the width: a shorter drag is enough to turn the page
// Photo carousel only: quicker than the shared sheet/drawer spring so a swipe feels immediate.
const SPRING_SWIPE = { damping: 1, response: 0.2 }
const SPRING_SWIPE_FLICK = { damping: 0.9, response: 0.18 }

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
  /** A slide that is animating to its new photo but has not been swapped in yet. */
  const pending = useRef<1 | -1 | null>(null)
  const cbs = useRef({ onNext, onPrev })
  const countRef = useRef(count)
  useEffect(() => {
    cbs.current = { onNext, onPrev }
    countRef.current = count
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

  /**
   * Slide the track one photo over. The neighbours are ALREADY rendered, so the next
   * photo is on screen the whole time (no blank frame). When the spring lands we swap
   * the index synchronously and recentre the track in the same task, before paint.
   */
  /**
   * If a slide is still animating in, land it NOW (swap the photo, keep the track where it visually is) so the
   * next tap or grab starts from the right photo. This is what lets you page through many photos per second:
   * no tap or swipe is ever dropped or ignored while an animation runs.
   */
  const finishPending = useCallback(() => {
    const spring = springRef.current
    const dir = pending.current
    if (!spring || !dir) return
    pending.current = null
    const cur = spring.value
    spring.stop()
    flushSync(() => (dir === 1 ? cbs.current.onNext() : cbs.current.onPrev()))
    spring.set(cur + dir * width())
  }, [])

  const commit = useCallback((dirIn: 1 | -1, velocity = 0, fromFlick = false) => {
    const spring = springRef.current
    if (!spring) return
    finishPending()
    // With only two photos there is no "previous" neighbour in the DOM: always slide the same way.
    const dir: 1 | -1 = countRef.current < 3 ? 1 : dirIn
    const w = width()
    const swap = () => (dir === 1 ? cbs.current.onNext() : cbs.current.onPrev())
    if (prefersReducedMotion()) {
      spring.set(0)
      swap()
      return
    }
    pending.current = dir
    spring.to(-dir * w, {
      velocity,
      config: fromFlick ? SPRING_SWIPE_FLICK : SPRING_SWIPE,
      onComplete: () => {
        pending.current = null
        flushSync(() => swap())
        spring.set(0)
      },
    })
  }, [finishPending])

  const settle = useCallback((velocity = 0, fromFlick = false) => {
    springRef.current?.to(0, { velocity, config: fromFlick ? SPRING_SWIPE_FLICK : SPRING_SWIPE })
  }, [])

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (count < 2 || (e.pointerType === 'mouse' && e.button !== 0)) return
    const spring = springRef.current
    // Interrupt: land any slide still animating, then stop where the photo is right now.
    finishPending()
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
    else if (Math.abs(pos + project(v)) > width() * COMMIT_FRACTION) dir = pos < 0 ? 1 : -1
    if (countRef.current < 3 && dir === -1) dir = 0
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
