import type { TreeViewModel } from '@/presentation/mappers/tree-view-models'

type TreeFactsProps = Readonly<{ tree: TreeViewModel }>

/** Owner, size, visibility and the reader's role, as a description list (text, never colour alone). */
export function TreeFacts({ tree }: TreeFactsProps) {
  const facts = [
    { term: 'Propriétaire', detail: tree.ownerName },
    { term: 'Membres', detail: tree.memberCountLabel },
    { term: 'Visibilité', detail: tree.visibilityLabel },
    { term: 'Votre rôle', detail: tree.roleLabel },
  ]

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
      {facts.map(({ term, detail }) => (
        <div key={term} className="contents">
          <dt className="font-medium">{term}</dt>
          <dd>{detail}</dd>
        </div>
      ))}
    </dl>
  )
}
