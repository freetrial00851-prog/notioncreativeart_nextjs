'use client'

import { useEffect, useRef, useState } from 'react'
import { deriveVariantUrl } from '../lib/imageVariants'
import { useFocusTrap } from '../lib/useFocusTrap'
import { useSwipeCarousel } from '../lib/useSwipeCarousel'
import { MaterialIcon } from './MaterialIcon'

/**
 * Full-screen photo viewer for the product gallery.
 * - Swipe left and right (or use the arrows / arrow keys): same sliding motion as the main gallery.
 * - Endless: after the last photo comes the first, and before the first comes the last.
 * - The next and previous photos are already on screen beside the current one, and the rest load quietly in the
 *   background just after it opens, so moving on is instant. Photos are the 1000px size: fast to show, still sharp.
 * - Pinch to zoom on a phone. Escape or the close button leaves.
 */
export function GalleryLightbox({
  images,
  startIndex,
  title,
  onClose,
}: {
  images: string[]
  startIndex: number
  title: string
  onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const count = images.length

  // Stop the page behind from scrolling. A light lock (no re-layout of the whole page, which made opening stutter).
  useEffect(() => {
    const html = document.documentElement
    const previous = html.style.overflow
    html.style.overflow = 'hidden'
    return () => {
      html.style.overflow = previous
    }
  }, [])
  useFocusTrap(dialogRef, true, { onEscape: onClose, initialFocusRef: closeRef })

  const { containerRef, slideRef, go, handlers } = useSwipeCarousel({
    count,
    onNext: () => setIndex((i) => (i + 1) % count),
    onPrev: () => setIndex((i) => (i - 1 + count) % count),
  })

  // Once the viewer is open and steady, quietly load the other photos (one by one) so swiping never waits.
  // Starting this at the same moment as opening made the viewer stutter.
  useEffect(() => {
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    images.forEach((src, i) => {
      timers.push(
        setTimeout(() => {
          if (cancelled) return
          const img = new window.Image()
          img.decoding = 'async'
          img.src = deriveVariantUrl(src, 'large')
        }, 500 + i * 150),
      )
    })
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [images])

  useEffect(() => {
    if (count < 2) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [count, go])

  // The photo in the middle plus its neighbours (like the main gallery), so the next photo is already visible.
  const slides = (() => {
    const offsets = count >= 3 ? [-1, 0, 1] : count === 2 ? [0, 1] : [0]
    return offsets.map((off) => ({ off, idx: (index + off + count) % count }))
  })()

  const btn = 'inline-flex size-11 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm hover:bg-white'

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${title}: photo ${index + 1} of ${count}`}
      className="fixed inset-0 z-[80] bg-black/90"
    >
      <div ref={containerRef} className="absolute inset-0 overflow-hidden" style={{ touchAction: 'pan-y pinch-zoom' }} {...handlers}>
        <div ref={slideRef} className="absolute inset-0 will-change-transform">
          {slides.map(({ off, idx }) => (
            <div
              key={idx}
              className="absolute inset-0 flex items-center justify-center"
              style={{ transform: `translate3d(${off * 100}%,0,0)` }}
              onClick={(e) => e.target === e.currentTarget && onClose()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={deriveVariantUrl(images[idx], 'large')}
                decoding="async"
                fetchPriority={off === 0 ? 'high' : 'low'}
                alt={off === 0 ? `${title}, photo ${idx + 1} of ${count}` : ''}
                aria-hidden={off !== 0 || undefined}
                className="max-h-[92dvh] max-w-[96vw] select-none object-contain"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      <button ref={closeRef} type="button" onClick={onClose} aria-label="Close photo viewer" className={`absolute right-3 top-3 ${btn}`}>
        <MaterialIcon name="close" size={22} />
      </button>
      {count > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className={`absolute left-3 top-1/2 -translate-y-1/2 ${btn}`}>
            <MaterialIcon name="chevron_left" size={24} />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next photo" className={`absolute right-3 top-1/2 -translate-y-1/2 ${btn}`}>
            <MaterialIcon name="chevron_right" size={24} />
          </button>
          <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[13px] text-white" aria-hidden>
            {index + 1} / {count}
          </p>
        </>
      )}
    </div>
  )
}
