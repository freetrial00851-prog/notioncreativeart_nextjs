'use client'

import Link from 'next/link'

type LogoProps = {
  variant?: 'full' | 'compact' | 'footer'
  className?: string
}

/**
 * Brand lockup — orange accent circle + wordmark (DESIGN_SPEC §2).
 * Baloo 2 via --font-logo.
 */
export function Logo({ variant = 'full', className = '' }: LogoProps) {
  const onDark = variant === 'footer'
  return (
    <Link
      href="/"
      className={`shrink-0 leading-none inline-flex items-center gap-2 ${
        variant === 'full' ? 'max-[361px]:gap-1' : ''
      } ${className}`}
      aria-label="Notion Creative Art — home"
    >
      <span
        className={`shrink-0 rounded-full ${
          variant === 'compact'
            ? 'w-2.5 h-2.5'
            : variant === 'full'
              ? 'w-3 h-3 max-[361px]:w-2 max-[361px]:h-2'
              : 'w-3 h-3'
        }`}
        style={{ background: 'var(--color-logo-accent)' }}
        aria-hidden
      />
      <span
        className={`font-bold tracking-tight leading-none ${
          variant === 'compact'
            ? 'text-[18px]'
            : variant === 'full'
              ? 'text-[18px] max-[361px]:text-[12px] max-[360px]:text-[11px] md:text-[20px]'
              : 'text-[18px] md:text-[20px]'
        }`}
        style={{
          color: onDark ? '#FFFFFF' : 'var(--color-primary)',
          fontFamily: 'var(--font-logo)',
        }}
      >
        Notion Creative Art
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
        className="absolute rounded-full"
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
