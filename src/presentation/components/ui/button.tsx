import type { ComponentPropsWithoutRef } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'forest'
export type ButtonSize = 'md' | 'sm'

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Busy state: blocks further clicks and is exposed to assistive technology. */
  loading?: boolean
}

const BASE_CLASS_NAME =
  'inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60'

const VARIANT_CLASS_NAMES: Readonly<Record<ButtonVariant, string>> = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
  ghost: 'text-gray-600 hover:bg-gray-100 hover:text-brand',
  forest: 'bg-forest text-white hover:bg-forest-light',
}

const SIZE_CLASS_NAMES: Readonly<Record<ButtonSize, string>> = {
  md: 'min-h-11 px-4 py-2',
  sm: 'min-h-8 px-3 py-1.5',
}

/** The classes of a button, for links that must look like one. */
export function buttonClassName(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
): string {
  return [BASE_CLASS_NAME, VARIANT_CLASS_NAMES[variant], SIZE_CLASS_NAMES[size]].join(' ')
}

/** A native `<button>`: every native attribute (type, aria-*, handlers) passes through. */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[buttonClassName(variant, size), className].filter(Boolean).join(' ')}
    />
  )
}
