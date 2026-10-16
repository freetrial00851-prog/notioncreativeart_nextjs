import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'md' | 'lg'

const VARIANT: Record<Variant, string> = {
  primary:
    'border-2 border-primary bg-primary text-primary-contrast hover:border-violet hover:bg-violet disabled:opacity-50',
  secondary:
    'border-2 border-ink bg-bg text-ink hover:bg-ink hover:text-white disabled:opacity-50',
  ghost: 'border-2 border-transparent bg-transparent text-ink underline underline-offset-4 hover:text-violet disabled:opacity-50',
}

const SIZE: Record<Size, string> = {
  md: 'min-h-11 px-5 text-[11px]',
  lg: 'min-h-[52px] px-6 text-[11px]',
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
      className={`inline-flex items-center justify-center gap-2 rounded-[3px] font-semibold uppercase tracking-[0.12em] transition-colors ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      {...rest}
    >
      {iconLeft}
      {loading ? 'Please wait…' : children}
      {iconRight}
    </button>
  )
}
