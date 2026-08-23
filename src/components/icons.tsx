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

/** Person in circle — account (account_circle style) */
export function PersonIcon({ size = 22, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="9.25" stroke={color} strokeWidth="1.75" fill="none" />
      <circle cx="12" cy="9" r="2.75" fill={color} />
      <path d="M6.8 17.6c1.2-2.1 3-3.1 5.2-3.1s4 1 5.2 3.1" fill={color} />
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

/** Order / receipt with check badge */
export function OrderIcon({ size = 22, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path
        fill={color}
        d="M7 3.5h10c.8 0 1.5.7 1.5 1.5v12.2l-1.2-.7-1.3.8-1.3-.8-1.2.7-1.3-.7-1.2.7-1.3-.8-1.3.8-1.2-.7V5c0-.8.7-1.5 1.5-1.5zm1.8 4.2h7.4v1.3H8.8V7.7zm0 3h7.4v1.3H8.8v-1.3zm0 3h4.6v1.3H8.8v-1.3z"
      />
      <circle cx="17.2" cy="17.2" r="4" fill={color} />
      <path d="M15.4 17.2l1.1 1.1 2.2-2.3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

/** Shopping bag — cart */
export function ShoppingBagIcon({ size = 22, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path
        fill={color}
        d="M7.2 8.2h9.6c.7 0 1.2.6 1.1 1.3l-.9 8.2c-.1.8-.8 1.4-1.6 1.4H8.6c-.8 0-1.5-.6-1.6-1.4l-.9-8.2c-.1-.7.4-1.3 1.1-1.3z"
      />
      <path
        d="M9 8.2V6.8c0-1.7 1.3-3 3-3s3 1.3 3 3v1.4"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M9.2 11.2c0 1.6 1.3 2.6 2.8 2.6s2.8-1 2.8-2.6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  )
}
