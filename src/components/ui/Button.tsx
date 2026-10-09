import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'md' | 'lg'

const VARIANT: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-contrast hover:bg-primary-hover disabled:opacity-50',
  secondary:
    'bg-white text-primary border-[1.5px] border-primary hover:bg-primary-soft disabled:opacity-50',
  ghost: 'bg-transparent text-primary hover:underline disabled:opacity-50',
}

const SIZE: Record<Size, string> = {
  md: 'min-h-11 px-5 text-[13px]',
  lg: 'min-h-[52px] px-7 text-[14px]',
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
}

/** Shared pill button — DESIGN_SPEC §3.4 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  iconLeft,
  iconRight,
  className = '',
  children,
  ...rest
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      {...rest}
    >
      {iconLeft}
      {loading ? 'Please wait…' : children}
      {iconRight}
    </button>
  )
}
