import Link from 'next/link'

type RestrictedTreeViewProps = Readonly<{
  title: string
  message: string
  treeHref: `/tree/${string}`
  signedIn: boolean
}>

/** Shown to a reader of a tree who may not open one of its pages; the tree itself stays readable. */
export function RestrictedTreeView({
  title,
  message,
  treeHref,
  signedIn,
}: RestrictedTreeViewProps) {
  return (
    <section aria-labelledby="restricted-title" className="max-w-prose space-y-4">
      <h1 id="restricted-title" className="text-3xl font-bold">
        {title}
      </h1>
      <p>{message}</p>
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
