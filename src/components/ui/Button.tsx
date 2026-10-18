import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'md' | 'lg'

/* Craft-shop buttons: warm outline + hard offset shadow that "presses in" (Gumroad-style),
   instead of flat template fills. */
const POP = 'shadow-[3px_3px_0_0_var(--color-navy)] hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_var(--color-navy)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-navy)] disabled:shadow-none'
const VARIANT: Record<Variant, string> = {
  primary: `border-2 border-navy bg-primary text-primary-contrast hover:bg-primary-hover disabled:opacity-50 ${POP}`,
  secondary: `border-2 border-navy bg-white text-navy hover:bg-sun disabled:opacity-50 ${POP}`,
  ghost: 'border-2 border-transparent bg-transparent text-ink underline decoration-coral decoration-2 underline-offset-4 hover:text-coral disabled:opacity-50',
}

const SIZE: Record<Size, string> = {
  md: 'min-h-11 px-5 text-[14px]',
  lg: 'min-h-[52px] px-7 text-[15px]',
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
      className={`inline-flex items-center justify-center gap-2 rounded-[10px] font-bold transition-[transform,box-shadow,background-color] ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      {...rest}
    >
      {iconLeft}
      {loading ? 'Please wait…' : children}
      {iconRight}
    </button>
  )
}
