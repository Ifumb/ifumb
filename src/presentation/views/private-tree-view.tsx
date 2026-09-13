import { LinkList, type LinkItem } from '@/presentation/views/link-list'

type PrivateTreeViewProps = Readonly<{ signedIn: boolean }>

const SIGNED_IN_LINKS: readonly LinkItem[] = [{ href: '/dashboard', label: 'Revenir à mes arbres' }]
const ANONYMOUS_LINKS: readonly LinkItem[] = [
  { href: '/login', label: 'Se connecter' },
  { href: '/', label: 'Revenir à l’accueil' },
]

/** Shown instead of a tree the reader may not see; never reveals the tree's name. */
export function PrivateTreeView({ signedIn }: PrivateTreeViewProps) {
  return (
    <section aria-labelledby="private-tree-title" className="max-w-prose space-y-4">
      <h1 id="private-tree-title" className="text-3xl font-bold">
        Cet arbre est privé
      </h1>
      <p>
        {signedIn
          ? 'Demandez une invitation à son propriétaire pour y accéder.'
          : 'Connectez-vous ou demandez une invitation au propriétaire pour accéder à cet arbre.'}
      </p>
      <LinkList links={signedIn ? SIGNED_IN_LINKS : ANONYMOUS_LINKS} />
    </section>
  )
}
