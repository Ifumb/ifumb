import Link from 'next/link'
import { Icon } from '@/presentation/components/ui/icon'

// reason: le pied de page reprend le même état de connexion que les autres accès de la page.
export function LandingFooterView({ signedIn }: Readonly<{ signedIn: boolean }>) {
  return (
    <footer className="landing-footer landing-container">
      <div>
        <Link href="/" className="landing-wordmark" aria-label="IFUMB — Accueil">
          <Icon name="branch" size={24} />
          <span>
            IFUMB<span className="landing-wordmark-dot">.</span>
          </span>
        </Link>
        <p>Les racines d’ici. Les liens de partout.</p>
      </div>
      <nav aria-label="Pied de page">
        <Link href="/explore">Arbres publics</Link>
        <a href="#comment-ca-marche">Comment ça marche</a>
        <Link href={signedIn ? '/dashboard' : '/login'}>
          {signedIn ? 'Mes arbres' : 'Se connecter'}
        </Link>
      </nav>
      <p className="landing-footer-note">
        Pour les familles africaines
        <br />
        et leur diaspora.
      </p>
    </footer>
  )
}
