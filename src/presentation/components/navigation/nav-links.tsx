'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export type NavLink = { readonly href: Route; readonly label: string }

/**
 * Site navigation links. The current page is marked with `aria-current="page"`, and links are not
 * prefetched: these few account links were re-prefetching the page being viewed (module 1.1).
 */
export function NavLinks({ links }: Readonly<{ links: readonly NavLink[] }>) {
  const pathname = usePathname()

  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2">
      {links.map(({ href, label }) => (
        <li key={href}>
          <Link href={href} prefetch={false} aria-current={pathname === href ? 'page' : undefined}>
            {label}
          </Link>
        </li>
      ))}
    </ul>
  )
}
