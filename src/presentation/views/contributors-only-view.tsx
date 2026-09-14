import Link from 'next/link'

type ContributorsOnlyViewProps = Readonly<{ treeHref: `/tree/${string}`; signedIn: boolean }>

/** Shown to readers of a tree who may not see its history; the tree itself stays readable. */
export function ContributorsOnlyView({ treeHref, signedIn }: ContributorsOnlyViewProps) {
  return (
    <section aria-labelledby="contributors-only-title" className="max-w-prose space-y-4">
      <h1 id="contributors-only-title" className="text-3xl font-bold">
        Journal réservé
      </h1>
      <p>Le journal est réservé aux contributeurs de l’arbre : son propriétaire et ses éditeurs.</p>
      <ul className="flex flex-wrap gap-x-6 gap-y-2">
        <li>
          <Link href={treeHref}>Revenir à l’arbre</Link>
        </li>
        {!signedIn && (
          <li>
            <Link href="/login">Se connecter</Link>
          </li>
        )}
      </ul>
    </section>
  )
}
