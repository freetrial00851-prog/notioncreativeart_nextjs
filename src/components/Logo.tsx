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

function FullMark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className="relative shrink-0 w-10 h-10 flex items-center justify-center text-[#FCFBF8] text-[18px] font-bold leading-none"
        style={{
          background: 'var(--color-accent)',
          borderRadius: '22%',
          fontFamily: 'var(--font-logo)',
        }}
      >
        N
        <span
          className="absolute w-[7px] h-[7px] rounded-full"
          style={{
            background: 'var(--color-logo-accent)',
            top: '4px',
            right: '4px',
          }}
          aria-hidden
        />
      </span>
      <span
        className="text-[19px] lg:text-[21px] font-bold tracking-tight leading-none"
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
