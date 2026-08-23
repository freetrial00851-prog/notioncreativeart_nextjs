/** Inline SVG icons matching the NCA UI icon set (not image files). */

type IconProps = {
  size?: number
  color?: string
  className?: string
  title?: string
}

/** Shared size for header / account menu icons so they stay visually consistent. */
export const UI_ICON_SIZE = 20

const base = (size: number, className: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  xmlns: 'http://www.w3.org/2000/svg',
  className,
  'aria-hidden': true as const,
  focusable: false as const,
})

/** Person in circle — account */
export function PersonIcon({ size = UI_ICON_SIZE, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.6" fill="none" />
      <circle cx="12" cy="9.2" r="2.6" fill={color} />
      <path d="M7.2 17.8c1.1-2 2.9-3 4.8-3s3.7 1 4.8 3" fill={color} />
    </svg>
  )
}

/** Filled heart — wishlist / favorite */
export function FavoriteIcon({ size = UI_ICON_SIZE, color = 'currentColor', className = '', filled = true }: IconProps & { filled?: boolean }) {
  const path =
    'M12 20.15l-1.35-1.23C5.7 14.4 2.5 11.5 2.5 8.1 2.5 5.4 4.6 3.3 7.3 3.3c1.55 0 3.05.72 4.05 1.86C12.35 4.02 13.85 3.3 15.4 3.3c2.7 0 4.8 2.1 4.8 4.8 0 3.4-3.2 6.3-8.15 10.82L12 20.15z'
  return (
    <svg {...base(size, className)}>
      <path d={path} fill={filled ? color : 'none'} stroke={color} strokeWidth={filled ? 0 : 1.7} strokeLinejoin="round" />
    </svg>
  )
}

/** Gear — account settings */
export function SettingsIcon({ size = UI_ICON_SIZE, color = 'currentColor', className = '' }: IconProps) {
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
export function ShareIcon({ size = UI_ICON_SIZE, color = 'currentColor', className = '' }: IconProps) {
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
export function CloseCircleIcon({ size = UI_ICON_SIZE, className = '', bg = '#4a4a4a', fg = '#ffffff' }: IconProps & { bg?: string; fg?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden focusable={false}>
      <circle cx="12" cy="12" r="11" fill={bg} />
      <path d="M8 8l8 8M16 8l-8 8" stroke={fg} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/** Download — dark circle with arrow (for downloads) */
export function DownloadCircleIcon({ size = UI_ICON_SIZE, className = '', bg = '#4a4a4a', fg = '#111111' }: IconProps & { bg?: string; fg?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden focusable={false}>
      <circle cx="12" cy="12" r="11" fill={bg} />
      <path d="M12 6.8v7" stroke={fg} strokeWidth="2" strokeLinecap="round" />
      <path d="M8.8 11.8L12 15l3.2-3.2" stroke={fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 17.2h8" stroke={fg} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/** Plain download glyph (no circle) */
export function DownloadIcon({ size = UI_ICON_SIZE, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 3v11M12 14l-3.5-3.5M12 14l3.5-3.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19h14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

/** Open box / package — orders */
export function OrderIcon({ size = UI_ICON_SIZE, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path
        fill={color}
        d="M4.8 9.2h14.4v10.2c0 .7-.5 1.2-1.2 1.2H6c-.7 0-1.2-.5-1.2-1.2V9.2zm1.8 4.2h2.2v1.4H6.6v-1.4z"
      />
      <path
        fill={color}
        d="M4.2 9.4L8.2 5.2h2.2l-2.8 4.2H4.2zm15.6 0h-3.4L13.6 5.2h2.2l4 4.2z"
      />
      <path fill={color} d="M8.5 5.2h7v1.5h-7V5.2z" />
    </svg>
  )
}

/** Shopping bag — cart (clear bag + arched handle, no lock-like cutout). */
export function ShoppingBagIcon({ size = UI_ICON_SIZE, color = 'currentColor', className = '' }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path
        d="M8 9.5h8l-.7 9.2a1.8 1.8 0 0 1-1.8 1.65H10.5a1.8 1.8 0 0 1-1.8-1.65L8 9.5z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M9.2 9.5V8.1c0-1.6 1.25-2.9 2.8-2.9s2.8 1.3 2.8 2.9v1.4"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

/** Cart — shared site-wide (wraps ShoppingBagIcon). */
export function CartIcon({ size = UI_ICON_SIZE, color = 'currentColor', className = '' }: IconProps) {
  return <ShoppingBagIcon size={size} color={color} className={className} />
}
