import Link from 'next/link'
import { BrandLogo } from '@/presentation/components/ui/brand-logo'

// reason: le pied de page reprend le même état de connexion que les autres accès de la page.
export function LandingFooterView({ signedIn }: Readonly<{ signedIn: boolean }>) {
  return (
    <footer className="landing-footer landing-container">
      <div className="landing-footer-columns">
        <div>
          <BrandLogo href="/" />
        </div>
        <nav aria-label="Découvrir">
          <h3>Découvrir</h3>
          <Link href="/explore">Arbres publics</Link>
          <a href="#comment-ca-marche">Comment ça marche</a>
        </nav>
        <nav aria-label="Votre compte">
          <h3>Votre compte</h3>
          {signedIn ? (
            <Link href="/dashboard">Mes arbres</Link>
          ) : (
            <>
              <Link href="/login">Se connecter</Link>
              <Link href="/register">Créer un compte</Link>
            </>
          )}
        </nav>
      </div>
      <nav aria-label="Informations légales" className="landing-footer-legal">
        <Link href="/legal/mentions-legales">Mentions légales</Link>
        <Link href="/legal/confidentialite">Confidentialité</Link>
        <Link href="/legal/cgu">CGU</Link>
        <Link href="/legal/credits">Crédits</Link>
      </nav>
    </footer>
  )
}
