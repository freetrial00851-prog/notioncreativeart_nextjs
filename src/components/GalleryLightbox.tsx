'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { deriveVariantUrl } from '../lib/imageVariants'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'
import { useFocusTrap } from '../lib/useFocusTrap'
import { MaterialIcon } from './MaterialIcon'

/**
 * Full-screen photo viewer for the product gallery. Shows the biggest photo the site has, lets people pinch-zoom
 * on a phone, and moves between photos with the arrows or the left and right keys. Escape or the close button leaves.
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

  useBodyScrollLock(true)
  useFocusTrap(dialogRef, true, { onEscape: onClose, initialFocusRef: closeRef })

  const go = useCallback((dir: 1 | -1) => setIndex((i) => (i + dir + count) % count), [count])

  useEffect(() => {
    if (count < 2) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [count, go])

  const btn =
    'inline-flex size-11 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm hover:bg-white'

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${title}: photo ${index + 1} of ${count}`}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={deriveVariantUrl(images[index], 'full')}
        alt={`${title}, photo ${index + 1} of ${count}`}
        className="max-h-[92dvh] max-w-[96vw] select-none object-contain"
        style={{ touchAction: 'pinch-zoom' }}
        draggable={false}
      />
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
