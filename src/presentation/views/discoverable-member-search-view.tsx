import Link from 'next/link'
import { SendContactRequestForm } from '@/presentation/components/forms/send-contact-request-form'
import type {
  DiscoverableMemberRowViewModel,
  DiscoverableMemberSearchViewModel,
} from '@/presentation/mappers/discoverable-member-view-models'
import { PaginationView } from '@/presentation/views/pagination-view'

type DiscoverableSearchProps = Readonly<{
  search: DiscoverableMemberSearchViewModel
  signedIn: boolean
}>

/**
 * Discoverable members of private and shared trees, alongside `PublicMemberSearchView` on the same
 * page — its own section, its own pagination (module 3.1). Never a name or link to the tree itself:
 * the only action here is asking its owner to be put in touch.
 */
export function DiscoverableMemberSearchView({ search, signedIn }: DiscoverableSearchProps) {
  if (!search.query) return null
  return (
    <section aria-labelledby="discoverable-members-title" className="space-y-6">
      <h2 id="discoverable-members-title" className="text-2xl font-bold">
        Membres découvrables d’arbres privés
      </h2>
      <p role="status">{search.status}</p>
      {search.members.length > 0 && (
        <ul className="space-y-3">
          {search.members.map((member) => (
            <DiscoverableMemberRow key={member.memberId} member={member} signedIn={signedIn} />
          ))}
        </ul>
      )}
      {search.pagination && <PaginationView pagination={search.pagination} />}
    </section>
  )
}

type RowProps = Readonly<{ member: DiscoverableMemberRowViewModel; signedIn: boolean }>

function DiscoverableMemberRow({ member, signedIn }: RowProps) {
  return (
    <li className="space-y-2 rounded-lg border border-earth-sand bg-white p-4">
      <p className="font-semibold">{member.name}</p>
      {member.details && <p className="text-sm text-earth-bark">{member.details}</p>}
      <p className="text-sm">Arbre privé.</p>
      {member.statusLabel && <p className="text-sm">Demande : {member.statusLabel}</p>}
      {member.canSend &&
        (signedIn ? (
          <SendContactRequestForm memberId={member.memberId} memberName={member.name} />
        ) : (
          <p className="text-sm">
            <Link href="/login">Connectez-vous</Link> pour contacter le propriétaire de cet arbre.
          </p>
        ))}
    </li>
  )
}
