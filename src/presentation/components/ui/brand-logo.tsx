import type { Route } from 'next'
import Link from 'next/link'

type BrandLogoProps = Readonly<{ href: Route }>

// reason: le logo IFUMB est partage par le header de l'app, celui de la landing et son pied de page.
export function BrandLogo({ href }: BrandLogoProps) {
  return (
    <Link href={href} prefetch={false} className="flex shrink-0 flex-col leading-tight no-underline">
      <span className="text-xl font-bold tracking-tight text-brand">IFUMB</span>
      <span className="hidden text-xs font-normal text-gray-500 sm:block">
        Réseau généalogique culturel
      </span>
    </Link>
  )
}
