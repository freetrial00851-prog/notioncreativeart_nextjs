'use client'

import Link from 'next/link'

type LogoProps = {
  variant?: 'full' | 'compact' | 'footer'
  className?: string
  /** Force the white wordmark (e.g. over a dark background). */
  light?: boolean
}

/**
 * Brand lockup — violet “N.” mark, serif wordmark and a small tagline
 * (colourful landing page reference).
 */
export function Logo({ variant = 'full', className = '', light = false }: LogoProps) {
  const compact = variant === 'compact'
  const onDark = variant === 'footer' || light
  return (
    <Link
      href="/"
      className={`inline-flex shrink-0 items-center gap-[11px] leading-none ${className}`}
      aria-label="NotionCreativeArt — home"
    >
      <span
        className={`grid shrink-0 place-items-center rounded-[12px] bg-violet font-heading font-normal text-white ${
          compact ? 'size-8 text-[18px]' : 'size-[38px] text-[21px] max-[380px]:size-8 max-[380px]:text-[18px]'
        }`}
        aria-hidden
      >
        N.
      </span>
      <span className="flex flex-col">
        <span
          className={`font-heading leading-none tracking-[-0.025em] ${onDark ? 'text-white' : 'text-ink'} ${
            compact ? 'text-[18px]' : 'text-[20px] max-[380px]:text-[17px]'
          }`}
        >
          NotionCreativeArt
        </span>
        {!compact && (
          <span
            className={`mt-1 text-[9px] font-semibold uppercase tracking-[0.22em] max-[420px]:hidden ${onDark ? 'text-white/70' : 'text-muted'}`}
          >
            Patterns for makers
          </span>
        )}
      </span>
    </Link>
  )
}

/** Square “N” tile — kept for overlays / chat that need a mark without the wordmark. */
export function LogoIcon({
  size = 40,
  onAccent = false,
  className = '',
}: {
  size?: number
  onAccent?: boolean
  className?: string
}) {
  const tile = onAccent ? '#FCFBF8' : 'var(--color-primary)'
  const letter = onAccent ? 'var(--color-primary)' : '#FCFBF8'
  const dot = Math.max(5, Math.round(size * 0.175))
  const inset = Math.max(3, Math.round(size * 0.1))
  return (
    <span
      className={`relative shrink-0 flex items-center justify-center font-bold leading-none ${className}`}
      style={{
        width: size,
        height: size,
        background: tile,
        color: letter,
        borderRadius: '22%',
        fontFamily: 'var(--font-logo)',
        fontSize: Math.round(size * 0.45),
      }}
      aria-hidden
    >
      N
      <span
        className="absolute rounded-[3px]"
        style={{
          background: 'var(--color-logo-accent)',
          width: dot,
          height: dot,
          top: inset,
          right: inset,
        }}
      />
    </span>
  )
}
