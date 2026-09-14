import Form from 'next/form'
import Link from 'next/link'
import { Button } from '@/presentation/components/ui/button'
import { SearchField } from '@/presentation/components/ui/search-field'
import type {
  MemberSearchViewModel,
  PublicMemberRowViewModel,
} from '@/presentation/mappers/explore-view-models'
import { EXPLORE_PARAMS as P } from '@/presentation/schemas/explore-schema'
import { PaginationView } from '@/presentation/views/pagination-view'

type SearchProps = Readonly<{ search: MemberSearchViewModel }>

export function PublicMemberSearchView({ search }: SearchProps) {
  return (
    <section aria-labelledby="public-members-title" className="space-y-6">
      <h2 id="public-members-title" className="text-2xl font-bold">
        Membres des arbres publics
      </h2>
      <PublicMemberSearchForm query={search.query} />
      <p role="status">{search.status}</p>
      {search.members.length > 0 && (
        <ul className="space-y-3">
          {search.members.map((member) => (
            <PublicMemberRow key={member.href} member={member} />
          ))}
        </ul>
      )}
      {search.pagination && <PaginationView pagination={search.pagination} />}
    </section>
  )
}

function PublicMemberSearchForm({ query }: Readonly<{ query?: string }>) {
  return (
    <Form action="/explore/members" role="search" className="flex flex-wrap items-end gap-3">
      <SearchField
        id="explore-members-text"
        name={P.text}
        label="Rechercher un membre"
        defaultValue={query}
      />
      <Button type="submit" variant="secondary">
        Rechercher
      </Button>
    </Form>
  )
}

function PublicMemberRow({ member }: Readonly<{ member: PublicMemberRowViewModel }>) {
  return (
    <li className="space-y-1 rounded-lg border border-earth-sand bg-white p-4">
      <Link href={member.href} className="font-semibold">
        {member.name}
      </Link>
      {member.details && <p className="text-sm text-earth-bark">{member.details}</p>}
      <p className="text-sm">
        Arbre : <Link href={member.tree.href}>{member.tree.name}</Link>
      </p>
    </li>
  )
}
