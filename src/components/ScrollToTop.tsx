'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const POSITIONS_KEY = 'nca_scroll_positions'
const TRAVERSE_KEY = 'nca_nav_traverse'

function readPositions(): Record<string, number> {
  try {
    const raw = sessionStorage.getItem(POSITIONS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, number>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/** After a link click, ignore zeroing writes for this path until we leave it. */
let pinned: { path: string; y: number } | null = null

function savePosition(path: string, y: number) {
  if (!path) return
  try {
    if (pinned && pinned.path === path && y < 8 && pinned.y > 8) {
      return
    }
    const all = readPositions()
    all[path] = Math.max(0, Math.round(y))
    sessionStorage.setItem(POSITIONS_KEY, JSON.stringify(all))
  } catch {
    // sessionStorage unavailable
  }
}

function pinPosition(path: string, y: number) {
  pinned = { path, y: Math.max(0, Math.round(y)) }
  savePosition(path, y)
}

function savedPosition(path: string): number {
  if (pinned && pinned.path === path) return pinned.y
  return readPositions()[path] ?? 0
}

function markTraverse() {
  try {
    sessionStorage.setItem(TRAVERSE_KEY, '1')
  } catch {
    // ignore
  }
}

function isTraversePending(): boolean {
  try {
    return sessionStorage.getItem(TRAVERSE_KEY) === '1'
  } catch {
    return false
  }
}

function clearTraverse() {
  try {
    sessionStorage.removeItem(TRAVERSE_KEY)
  } catch {
    // ignore
  }
}

let restoreGeneration = 0
let lastRestoreAt = 0

function applyScroll(y: number) {
  window.scrollTo(0, y)
  document.documentElement.scrollTop = y
  document.body.scrollTop = y
}

function startRestore(path: string) {
  const y = savedPosition(path)
  const gen = ++restoreGeneration
  const started = performance.now()
  lastRestoreAt = started
  markTraverse()

  const tick = () => {
    if (gen !== restoreGeneration) return
    applyScroll(y)
    const elapsed = performance.now() - started
    if (elapsed > 400 && Math.abs(window.scrollY - y) <= 2) {
      clearTraverse()
      return
    }
    if (elapsed > 1200) {
      clearTraverse()
      return
    }
    requestAnimationFrame(tick)
  }

  applyScroll(y)
  requestAnimationFrame(tick)
}

function cancelRestore() {
  restoreGeneration += 1
  clearTraverse()
}

function recentlyRestored(): boolean {
  return performance.now() - lastRestoreAt < 500
}

/**
 * Forward navigations scroll to top; history back/forward restores the last
 * scrollY for that path (sessionStorage, keyed by pathname).
 */
export function ScrollToTop() {
  const pathname = usePathname()
  const pathRef = useRef(pathname)

  useEffect(() => {
    pathRef.current = pathname
    // We've arrived on a new route — release the pin from the previous page.
    if (pinned && pinned.path !== pathname) {
      pinned = null
    }
  }, [pathname])

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    const onPopState = () => {
      startRestore(window.location.pathname)
    }

    window.addEventListener('popstate', onPopState)

    // Navigation API (Chromium) — types are not in all TS lib targets yet.
    type NavApi = {
      addEventListener: (type: 'navigate', listener: (e: { navigationType: string; destination: { url: string } }) => void) => void
      removeEventListener: (type: 'navigate', listener: (e: { navigationType: string; destination: { url: string } }) => void) => void
    }
    const nav = (window as Window & { navigation?: NavApi }).navigation
    const onNavigate = (event: { navigationType: string; destination: { url: string } }) => {
      if (event.navigationType === 'traverse') {
        try {
          const dest = new URL(event.destination.url)
          startRestore(dest.pathname)
        } catch {
          startRestore(window.location.pathname)
        }
      }
    }
    nav?.addEventListener('navigate', onNavigate)

    // Persist scroll BEFORE Next.js zeroes it on push navigations.
    const persistBeforeNav = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest('a[href]')
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (anchor.target === '_blank' || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return
      try {
        const url = new URL(anchor.href, window.location.href)
        if (url.origin !== window.location.origin) return
        if (url.pathname === window.location.pathname && url.search === window.location.search) return
      } catch {
        return
      }
      pinPosition(pathRef.current ?? window.location.pathname, window.scrollY)
    }
    document.addEventListener('click', persistBeforeNav, true)

    const persist = () => savePosition(pathRef.current ?? window.location.pathname, window.scrollY)
    window.addEventListener('pagehide', persist)

    return () => {
      window.removeEventListener('popstate', onPopState)
      nav?.removeEventListener('navigate', onNavigate)
      document.removeEventListener('click', persistBeforeNav, true)
      window.removeEventListener('pagehide', persist)
    }
  }, [])

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        if (isTraversePending() && window.scrollY < 8) {
          ticking = false
          return
        }
        savePosition(pathname ?? window.location.pathname, window.scrollY)
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  useEffect(() => {
    const path = pathname ?? ''
    const hash = typeof window !== 'undefined' ? window.location.hash : ''

    if (hash) {
      cancelRestore()
      const id = hash.slice(1)
      const timer = setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ block: 'start' })
      }, 0)
      return () => clearTimeout(timer)
    }

    if (isTraversePending()) {
      startRestore(path)
      return
    }

    if (recentlyRestored()) return

    cancelRestore()
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
