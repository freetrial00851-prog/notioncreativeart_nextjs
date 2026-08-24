'use client'

import Link from 'next/link'

type LogoProps = {
  variant?: 'full' | 'compact'
  className?: string
}

/**
 * Brand lockup — full (icon tile + NotionCreativeArt) or compact (NCA + coral dot).
 * Matches LOGO/logo-full.svg and LOGO/logo-compact.svg; Baloo 2 via --font-logo.
 */
export function Logo({ variant = 'full', className = '' }: LogoProps) {
  return (
    <Link
      href="/"
      className={`shrink-0 leading-none inline-flex items-center ${className}`}
      aria-label="Notion Creative Art — home"
    >
      {variant === 'compact' ? <CompactMark /> : <FullMark />}
    </Link>
  )
}

/** Square “N” tile used in the full logo — no link (safe inside overlays). */
export function LogoIcon({
  size = 40,
  onAccent = false,
  className = '',
}: {
  size?: number
  /** Invert for dark/accent backgrounds (e.g. chat header). */
  onAccent?: boolean
  className?: string
}) {
  const tile = onAccent ? '#FCFBF8' : 'var(--color-accent)'
  const letter = onAccent ? 'var(--color-accent)' : '#FCFBF8'
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

function FullMark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoIcon size={40} />
      <span
        className="text-[19px] desktop:text-[21px] font-bold tracking-tight leading-none"
        style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-logo)' }}
      >
        NotionCreativeArt
      </span>
    </span>
  )
}

function CompactMark() {
  return (
    <span className="relative inline-block pr-2.5">
      <span
        className="text-[28px] font-extrabold tracking-[0.04em] leading-none"
        style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-logo)' }}
      >
        NCA
      </span>
      <span
        className="absolute w-[9px] h-[9px] rounded-full"
        style={{
          background: 'var(--color-logo-accent)',
          top: '1px',
          right: '0',
        }}
        aria-hidden
      />
    </span>
  )
}
