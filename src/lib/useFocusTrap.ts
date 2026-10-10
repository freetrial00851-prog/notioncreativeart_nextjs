'use client'

import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Open traps, newest last. Only the top one handles Tab / Escape, so an auth
 *  modal opened from the cart drawer doesn't fight the drawer for focus. */
const stack: symbol[] = []

function focusables(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.getClientRects().length > 0,
  )
}

/**
 * Dialog focus management: moves focus inside on open, keeps Tab / Shift+Tab
 * inside the container, calls onEscape on Escape, and returns focus to the
 * element that was focused before opening.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  {
    initialFocusRef,
    onEscape,
  }: { initialFocusRef?: RefObject<HTMLElement | null>; onEscape?: () => void } = {},
) {
  const onEscapeRef = useRef(onEscape)
  useEffect(() => {
    onEscapeRef.current = onEscape
  })

  useEffect(() => {
    if (!active) return
    const id = Symbol('focus-trap')
    stack.push(id)
    const previouslyFocused = document.activeElement as HTMLElement | null

    const focusFirst = () => {
      const container = containerRef.current
      if (!container) return
      const target = initialFocusRef?.current ?? focusables(container)[0] ?? container
      target.focus({ preventScroll: true })
    }
    const raf = requestAnimationFrame(focusFirst)

    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== id) return
      if (e.key === 'Escape') {
        if (onEscapeRef.current) {
          e.preventDefault()
          onEscapeRef.current()
        }
        return
      }
      if (e.key !== 'Tab') return
      const container = containerRef.current
      if (!container) return
      const items = focusables(container)
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const current = document.activeElement as HTMLElement | null
      const inside = !!current && container.contains(current)
      if (e.shiftKey && (current === first || !inside)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (current === last || !inside)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKey)
      const idx = stack.indexOf(id)
      if (idx >= 0) stack.splice(idx, 1)
      if (previouslyFocused?.isConnected) previouslyFocused.focus({ preventScroll: true })
    }
  }, [active, containerRef, initialFocusRef])
}
