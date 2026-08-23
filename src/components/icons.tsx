/** Inline SVG icons matching the NCA UI icon set (not image files). */

type IconProps = {
  size?: number
  color?: string
  className?: string
  title?: string
}

const base = (size: number, className: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  className,
  'aria-hidden': true as const,
  focusable: false as const,
})

/** Person silhouette — account */
export function PersonIcon({ size = 22, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="8" r="3.5" fill={color} />
      <path d="M4.5 19.5c0-3.6 3.1-6 7.5-6s7.5 2.4 7.5 6" fill={color} />
    </svg>
  )
}

/** Filled heart — wishlist / favorite */
export function FavoriteIcon({ size = 22, color = 'currentColor', className = '', filled = true }: IconProps & { filled?: boolean }) {
  if (!filled) {
    return (
      <svg {...base(size, className)}>
        <path
          d="M12 20.2l-1.45-1.32C5.4 14.36 2 11.28 2 7.5 2 4.42 4.42 2 7.5 2c1.74 0 3.41.81 4.5 2.09C13.09 2.81 14.76 2 16.5 2 19.58 2 22 4.42 22 7.5c0 3.78-3.4 6.86-8.55 11.38L12 20.2z"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  return (
    <svg {...base(size, className)}>
      <path
        d="M12 20.2l-1.45-1.32C5.4 14.36 2 11.28 2 7.5 2 4.42 4.42 2 7.5 2c1.74 0 3.41.81 4.5 2.09C13.09 2.81 14.76 2 16.5 2 19.58 2 22 4.42 22 7.5c0 3.78-3.4 6.86-8.55 11.38L12 20.2z"
        fill={color}
      />
    </svg>
  )
}

/** Gear — account settings */
export function SettingsIcon({ size = 22, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path
        fill={color}
        d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.2 7.2 0 0 0-1.63-.94l-.36-2.54A.48.48 0 0 0 13.9 2h-3.8a.48.48 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.55-1.63.94l-2.39-.96a.49.49 0 0 0-.59.22L2.73 8.47a.49.49 0 0 0 .12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.85 14.52a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.38.3.59.22l2.39-.96c.5.39 1.04.7 1.63.94l.36 2.54c.05.24.25.41.48.41h3.8c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.55 1.63-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"
      />
    </svg>
  )
}

/** Share network — share listing */
export function ShareIcon({ size = 22, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="18" cy="5" r="2.6" fill={color} />
      <circle cx="6" cy="12" r="2.6" fill={color} />
      <circle cx="18" cy="19" r="2.6" fill={color} />
      <path d="M8.4 10.9l7.2-4.2M8.4 13.1l7.2 4.2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

/** Close — dark circle with white X (for popups) */
export function CloseCircleIcon({ size = 24, className = '', bg = '#4a4a4a', fg = '#ffffff' }: IconProps & { bg?: string; fg?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden focusable={false}>
      <circle cx="12" cy="12" r="11" fill={bg} />
      <path d="M8 8l8 8M16 8l-8 8" stroke={fg} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/** Download — dark circle with white arrow (for downloads) */
export function DownloadCircleIcon({ size = 22, className = '', bg = '#4a4a4a', fg = '#ffffff' }: IconProps & { bg?: string; fg?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden focusable={false}>
      <circle cx="12" cy="12" r="11" fill={bg} />
      <path d="M12 6.5v7.2M12 13.7l-3-3M12 13.7l3-3" stroke={fg} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 17.5h9" stroke={fg} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

/** Plain download glyph (no circle) for compact menus */
export function DownloadIcon({ size = 22, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 3v11M12 14l-3.5-3.5M12 14l3.5-3.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19h14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
