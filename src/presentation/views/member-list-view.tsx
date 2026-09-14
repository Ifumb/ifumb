import Link from 'next/link'
import { memberCountLabel } from '@/presentation/labels/tree-labels'
import type { MemberListItemViewModel } from '@/presentation/mappers/member-view-models'
import { MemberSearchForm } from '@/presentation/views/member-search-form'

type MemberListViewProps = Readonly<{
  treeHref: `/tree/${string}`
  members: readonly MemberListItemViewModel[]
  query?: string
}>

/** The accessible, text alternative to the family graph: every member, searchable. */
export function MemberListView({ treeHref, members, query }: MemberListViewProps) {
  return (
    <section id="members" aria-labelledby="members-title" className="space-y-4">
      <h2 id="members-title" className="text-2xl font-bold">
        Membres
      </h2>
      <MemberSearchForm treeHref={treeHref} query={query} />
      <p>{resultsLabel(members.length, query)}</p>
      {members.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {members.map((member) => (
            <li key={member.id}>
              <MemberListItem member={member} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function MemberListItem({ member }: Readonly<{ member: MemberListItemViewModel }>) {
  return (
    <div className="rounded-lg border border-earth-sand bg-white p-4">
      <Link href={member.href} className="font-semibold">
        {member.name}
      </Link>
      {member.nickname && <span> « {member.nickname} »</span>}
      {member.lifespan && <p className="text-sm">{member.lifespan}</p>}
      {member.culture && <p className="text-sm">{member.culture}</p>}
    </div>
  )
}

function resultsLabel(count: number, query?: string): string {
  if (!query)
    return count === 0 ? 'Cet arbre ne compte encore aucun membre.' : memberCountLabel(count)
  if (count === 0) return `Aucun membre ne correspond à « ${query} ».`
  return `${count} ${count > 1 ? 'résultats' : 'résultat'} pour « ${query} »`
}
