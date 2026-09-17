import Link from 'next/link'
import { LocalDateTime } from '@/presentation/components/ui/local-date-time'
import type { CrossTreeLinkItemViewModel } from '@/presentation/mappers/cross-tree-link-view-models'

type CrossTreeLinksViewProps = Readonly<{
  treeName: string
  treeHref: `/tree/${string}`
  items: readonly CrossTreeLinkItemViewModel[]
}>

export function CrossTreeLinksView({ treeName, treeHref, items }: CrossTreeLinksViewProps) {
  return (
    <section aria-labelledby="links-title" className="space-y-6">
      <p>
        <Link href={treeHref}>Retour à {treeName}</Link>
      </p>
      <h1 id="links-title" className="text-3xl font-bold">
        Liaisons inter-arbres — {treeName}
      </h1>
      {items.length === 0 ? (
        <p>Aucune liaison établie avec un autre arbre.</p>
      ) : (
        <ol className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="space-y-2 rounded-lg border border-earth-sand bg-white p-4">
              <p>
                <strong>{item.ownMemberName}</strong> est relié(e) à{' '}
                <strong>{item.linkedMemberName}</strong>, de{' '}
                {item.linkedTreeHref ? (
                  <Link href={item.linkedTreeHref}>{item.linkedTreeName}</Link>
                ) : (
                  item.linkedTreeName
                )}
                .
              </p>
              <p className="text-sm text-earth-bark">
                Établie le <LocalDateTime iso={item.createdAtIso} />
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
