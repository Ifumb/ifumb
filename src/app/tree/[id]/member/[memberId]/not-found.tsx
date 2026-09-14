import { LinkList } from '@/presentation/views/link-list'

const EXIT_LINKS = [
  { href: '/dashboard', label: 'Revenir à mes arbres' },
  { href: '/', label: 'Revenir à l’accueil' },
] as const

export default function MemberNotFound() {
  return (
    <section aria-labelledby="member-not-found-title" className="max-w-prose space-y-4">
      <h1 id="member-not-found-title" className="text-3xl font-bold">
        Fiche introuvable
      </h1>
      <p>Ce membre ou son arbre n’existe pas, ou a été supprimé. Vérifiez l’adresse de la page.</p>
      <LinkList links={EXIT_LINKS} />
    </section>
  )
}
