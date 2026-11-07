import Link from 'next/link'
import { BrandLogo } from '@/presentation/components/ui/brand-logo'

// reason: le pied de page reprend le même état de connexion que les autres accès de la page.
export function LandingFooterView({ signedIn }: Readonly<{ signedIn: boolean }>) {
  return (
    <footer className="landing-footer landing-container">
      <div>
        <BrandLogo href="/" withSubtitle={false} />
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
