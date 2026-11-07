import Link from 'next/link'
import { Icon } from '@/presentation/components/ui/icon'

type LandingHeaderViewProps = Readonly<{ signedIn: boolean }>

// reason: les deux navigations ont des noms distincts et restent accessibles sans menu JavaScript.
export function LandingHeaderView({ signedIn }: LandingHeaderViewProps) {
  return (
    <header className="landing-header landing-container">
      <Link href="/" className="landing-wordmark" aria-label="IFUMB — Accueil">
        <Icon name="branch" size={28} />
        <span>
          IFUMB<span className="landing-wordmark-dot">.</span>
        </span>
      </Link>
      <nav aria-label="Découvrir IFUMB" className="landing-section-nav">
        <a href="#pourquoi-ifumb">Pourquoi IFUMB ?</a>
        <a href="#comment-ca-marche">Comment ça marche</a>
        <Link href="/explore">Explorer</Link>
      </nav>
      <nav aria-label="Votre compte" className="landing-account-nav">
        {!signedIn && <Link href="/login">Se connecter</Link>}
        <Link href={signedIn ? '/dashboard' : '/register'} className="landing-header-action">
          {signedIn ? 'Mes arbres' : 'Créer mon arbre'}
          <Icon name="next" />
        </Link>
      </nav>
    </header>
  )
}
