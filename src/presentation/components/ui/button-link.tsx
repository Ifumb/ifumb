import type { Route } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { buttonClassName, type ButtonVariant } from '@/presentation/components/ui/button'

type ButtonLinkProps = Readonly<{ href: Route; variant?: ButtonVariant; children: ReactNode }>

/** A link that leads to another page, styled as a button because it starts a task. */
export function ButtonLink({ href, variant = 'primary', children }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={`${buttonClassName(variant)} inline-flex items-center no-underline`}
    >
      {children}
    </Link>
  )
}
