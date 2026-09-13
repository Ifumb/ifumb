import type { Route } from 'next'
import Link from 'next/link'

export type LinkItem = { readonly href: Route; readonly label: string }

export function LinkList({ links }: Readonly<{ links: readonly LinkItem[] }>) {
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2">
      {links.map(({ href, label }) => (
        <li key={href}>
          <Link href={href}>{label}</Link>
        </li>
      ))}
    </ul>
  )
}
