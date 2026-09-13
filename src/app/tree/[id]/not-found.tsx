import { LinkList } from '@/presentation/views/link-list'

const EXIT_LINKS = [
  { href: '/dashboard', label: 'Revenir à mes arbres' },
  { href: '/', label: 'Revenir à l’accueil' },
] as const

export default function TreeNotFound() {
  return (
    <section aria-labelledby="tree-not-found-title" className="max-w-prose space-y-4">
      <h1 id="tree-not-found-title" className="text-3xl font-bold">
        Arbre introuvable
      </h1>
      <p>Cet arbre n’existe pas ou a été supprimé. Vérifiez l’adresse de la page.</p>
      <LinkList links={EXIT_LINKS} />
    </section>
  )
}
