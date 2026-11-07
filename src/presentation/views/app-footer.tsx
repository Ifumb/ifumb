import Link from 'next/link'

// reason: pied de page minimal, uniquement pour garder les pages legales accessibles partout.
export function AppFooter() {
  return (
    <footer className="app-footer">
      <nav aria-label="Informations légales">
        <Link href="/legal/mentions-legales">Mentions légales</Link>
        <Link href="/legal/confidentialite">Confidentialité</Link>
        <Link href="/legal/cgu">CGU</Link>
        <Link href="/legal/credits">Crédits</Link>
      </nav>
    </footer>
  )
}
