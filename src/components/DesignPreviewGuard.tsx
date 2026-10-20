'use client'

import { useEffect } from 'react'

/**
 * Design-preview pages show mock listings. Disable the buy buttons so nobody can put a fake
 * item into a cart (everything else — gallery, tabs, hover, layout — stays fully interactive).
 */
export function DesignPreviewGuard() {
  useEffect(() => {
    const lock = () => {
      document.querySelectorAll<HTMLElement>('button, a').forEach((el) => {
        const t = (el.textContent ?? '').trim()
        if (/^(add to cart|add to bag|buy now|in cart|in your bag|get free)/i.test(t) || /add .* to cart|download .* free/i.test(el.getAttribute('aria-label') ?? '')) {
          if (el instanceof HTMLButtonElement) el.disabled = true
          el.setAttribute('aria-disabled', 'true')
          el.style.pointerEvents = 'none'
          el.style.opacity = '0.55'
          el.title = 'Disabled in the design preview'
        }
      })
    }
    lock()
    const mo = new MutationObserver(lock)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => mo.disconnect()
  }, [])
  return null
}
