'use client'

import { useEffect } from 'react'

/** Locks page scroll behind any open drawer/modal/overlay. Plain
 *  `overflow: hidden` on <body> doesn't reliably block touch-scrolling on
 *  iOS Safari, so this pins the body in place with position:fixed instead
 *  and restores the exact scroll position on close. Safe to use in
 *  multiple components at once. */
export function useBodyScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return
    const scrollY = window.scrollY
    const body = document.body
    const original = { position: body.style.position, top: body.style.top, left: body.style.left, right: body.style.right, width: body.style.width }

    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'

    return () => {
      body.style.position = original.position
      body.style.top = original.top
      body.style.left = original.left
      body.style.right = original.right
      body.style.width = original.width
      window.scrollTo(0, scrollY)
    }
  }, [isOpen])
}
