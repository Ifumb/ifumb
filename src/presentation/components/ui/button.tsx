import type { ComponentPropsWithoutRef } from 'react'

export type ButtonVariant = 'primary' | 'secondary'
export type ButtonSize = 'md'

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Busy state: blocks further clicks and is exposed to assistive technology. */
  loading?: boolean
}

const BASE_CLASS_NAME = 'rounded-md font-semibold disabled:opacity-70'

const VARIANT_CLASS_NAMES: Readonly<Record<ButtonVariant, string>> = {
  primary: 'bg-brand-dark text-earth-ivory',
  secondary: 'border-2 border-brand-dark text-brand-dark',
}

const SIZE_CLASS_NAMES: Readonly<Record<ButtonSize, string>> = {
  md: 'min-h-11 px-4 py-2',
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
  const classNames = [BASE_CLASS_NAME, VARIANT_CLASS_NAMES[variant], SIZE_CLASS_NAMES[size]]

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[...classNames, className].filter(Boolean).join(' ')}
    />
  )
}
