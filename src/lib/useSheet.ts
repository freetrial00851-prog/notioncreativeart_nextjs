import { useEffect, useRef, useCallback, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'
import { SPRING_DEFAULT, SPRING_FLICK, VelocityTracker, createSpring, prefersReducedMotion, project, rubberband, type Spring } from './spring'

const HYSTERESIS = 10 // px of movement before a drag commits
const FLICK_SPEED = 300 // px/s: above this, velocity SIGN decides open/close

/**
 * Bottom sheet (mobile) / side drawer (md+) driven by one spring.
 *
 * - Opens/closes with a critically damped spring (no overshoot), never a fixed duration.
 * - Interruptible: toggling or grabbing mid-flight starts from the live position and carries velocity.
 * - Mobile: drag the handle/header 1:1 (grab offset kept), rubber-band when pulled up past the top,
 *   release decides by velocity sign, projects momentum (decel 0.998) and hands off the exact velocity.
 * - Enter and exit use the same path (same axis).
 * - `prefers-reduced-motion`: no slide — a short cross-fade only.
 */
export function useSheet({
  open,
  onClose,
  panelRef,
  scrimRef,
  dragDisabled = false,
}: {
  open: boolean
  onClose: () => void
  panelRef: RefObject<HTMLDivElement | null>
  scrimRef: RefObject<HTMLDivElement | null>
  dragDisabled?: boolean
}) {
  const springRef = useRef<Spring | null>(null)
  const sizeRef = useRef(1)
  const axisRef = useRef<'y' | 'x'>('y')
  const reducedRef = useRef(false)
  const openRef = useRef(open)
  const closeRef = useRef(onClose)
  const drag = useRef<{ id: number; y0: number; startPos: number; committed: boolean } | null>(null)
  const tracker = useRef(new VelocityTracker())
  const first = useRef(true)
  useEffect(() => {
    closeRef.current = onClose
  })

  const apply = useCallback((pos: number) => {
    const panel = panelRef.current
    const scrim = scrimRef.current
    const size = sizeRef.current || 1
    if (panel) panel.style.transform = axisRef.current === 'y' ? `translate3d(0,${pos}px,0)` : `translate3d(${pos}px,0,0)`
    // Scrim follows the sheet continuously (feedback during the gesture, not just at the end).
    if (scrim) scrim.style.opacity = String(Math.max(0, Math.min(1, 1 - pos / size)))
  }, [panelRef, scrimRef])

  useEffect(() => {
    const spring = createSpring(0, apply)
    springRef.current = spring
    return () => spring.stop()
  }, [apply])

  // Open / close (or first paint) — always retargets from the live value.
  useEffect(() => {
    const panel = panelRef.current
    const scrim = scrimRef.current
    const spring = springRef.current
    if (!panel || !spring) return
    openRef.current = open
    const desktop = window.matchMedia('(min-width: 768px)').matches
    axisRef.current = desktop ? 'x' : 'y'
    const rect = panel.getBoundingClientRect()
    sizeRef.current = (desktop ? rect.width : rect.height) || 1
    reducedRef.current = prefersReducedMotion()
    const size = sizeRef.current

    if (reducedRef.current) {
      // Cross-fade only, no movement.
      spring.stop()
      panel.style.transform = 'none'
      panel.style.transition = 'opacity 200ms ease'
      if (scrim) scrim.style.transition = 'opacity 200ms ease'
      if (open) {
        panel.style.visibility = 'visible'
        requestAnimationFrame(() => {
          panel.style.opacity = '1'
          if (scrim) scrim.style.opacity = '1'
        })
      } else {
        panel.style.opacity = '0'
        if (scrim) scrim.style.opacity = '0'
        const t = window.setTimeout(() => {
          if (!openRef.current) panel.style.visibility = 'hidden'
        }, 200)
        return () => window.clearTimeout(t)
      }
      return
    }

    panel.style.transition = ''
    panel.style.opacity = ''
    if (scrim) scrim.style.transition = ''

    if (first.current) {
      first.current = false
      if (!open) {
        spring.set(size)
        panel.style.visibility = 'hidden'
        return
      }
    }
    if (open) {
      panel.style.visibility = 'visible'
      if (!spring.running && spring.value === 0 && panel.style.transform === '') spring.set(size)
      spring.to(0, { config: SPRING_DEFAULT })
    } else {
      spring.to(size, {
        config: SPRING_DEFAULT,
        onComplete: () => {
          if (!openRef.current) panel.style.visibility = 'hidden'
        },
      })
    }
  }, [open, panelRef, scrimRef])

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (dragDisabled || axisRef.current !== 'y' || reducedRef.current) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    // Let real controls (the close button) receive their click.
    if ((e.target as HTMLElement).closest('button, a, input')) return
    const spring = springRef.current
    if (!spring) return
    // Interrupt: grab the sheet exactly where it is right now (even mid-close).
    const startPos = spring.value
    spring.stop()
    drag.current = { id: e.pointerId, y0: e.clientY, startPos, committed: false }
    tracker.current.reset(e.clientY)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dy = e.clientY - d.y0
    if (!d.committed) {
      if (Math.abs(dy) < HYSTERESIS) return
      d.committed = true
    }
    tracker.current.push(e.clientY)
    // Track 1:1 minus the hysteresis, so the sheet does not jump when the drag commits.
    let pos = d.startPos + dy - Math.sign(dy) * HYSTERESIS
    // Past the open position (pulled up): resist progressively instead of stopping dead.
    if (pos < 0) pos = -rubberband(-pos, sizeRef.current)
    springRef.current?.set(pos)
  }

  const end = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    const spring = springRef.current
    if (!spring) return
    if (!d.committed) {
      // It was a tap on the handle, not a drag: put it back where it was.
      spring.to(d.startPos, { config: SPRING_DEFAULT })
      return
    }
    const size = sizeRef.current
    const v = tracker.current.velocity()
    const pos = spring.value
    const flick = Math.abs(v) > FLICK_SPEED
    // Velocity sign decides; otherwise the projected resting position does.
    const shouldClose = flick ? v > 0 : pos + project(v) > size * 0.5
    if (shouldClose) {
      openRef.current = false
      spring.to(size, {
        velocity: v,
        config: flick ? SPRING_FLICK : SPRING_DEFAULT,
        onComplete: () => {
          if (!openRef.current && panelRef.current) panelRef.current.style.visibility = 'hidden'
        },
      })
      closeRef.current()
    } else {
      spring.to(0, { velocity: v, config: flick ? SPRING_FLICK : SPRING_DEFAULT })
    }
  }

  return { dragHandlers: { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end } }
}
