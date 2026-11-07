import type { Route } from 'next'
import Link from 'next/link'

type BrandLogoProps = Readonly<{ href: Route; withSubtitle?: boolean }>

// reason: le logo IFUMB est partage par le header de l'app, celui de la landing et son pied de page.
export function BrandLogo({ href, withSubtitle = true }: BrandLogoProps) {
  return (
    <Link href={href} prefetch={false} className="flex shrink-0 items-center gap-2 no-underline">
      <span className="text-xl font-bold tracking-tight text-brand">IFUMB</span>
      {withSubtitle && (
        <span className="hidden text-xs font-normal text-gray-500 sm:block">
          Réseau généalogique culturel
        </span>
      )}
    </Link>
  )
}
