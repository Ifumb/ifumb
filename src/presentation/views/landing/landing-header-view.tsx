import Link from 'next/link'
import { BrandLogo } from '@/presentation/components/ui/brand-logo'

type LandingHeaderViewProps = Readonly<{ signedIn: boolean }>

// reason: reprend le logo, la hauteur et le style des boutons du header global (site-header),
// pour que passer de la landing a une page connectee ne change pas de produit a l'oeil.
export function LandingHeaderView({ signedIn }: LandingHeaderViewProps) {
  return (
    <header className="site-header">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
        <BrandLogo href="/" />
        <nav aria-label="Découvrir IFUMB" className="landing-section-nav">
          <a href="#pourquoi-ifumb">Pourquoi IFUMB ?</a>
          <a href="#comment-ca-marche">Comment ça marche</a>
          <Link href="/explore">Explorer</Link>
        </nav>
        <nav aria-label="Votre compte" className="flex items-center gap-3 text-sm">
          {!signedIn && (
            <Link href="/login" className="header-action">
              Se connecter
            </Link>
          )}
          <Link href={signedIn ? '/dashboard' : '/register'} className="rounded-lg bg-brand px-3 py-2 text-white">
            {signedIn ? 'Mes arbres' : 'Créer un compte'}
          </Link>
        </nav>
      </div>
    </header>
  )
}
