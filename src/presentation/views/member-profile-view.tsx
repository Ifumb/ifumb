import Link from 'next/link'
import { claimMemberAction } from '@/app/actions/claim-actions'
import { toggleMemberDiscoverableAction } from '@/app/actions/discoverable-actions'
import { ClaimMemberForm } from '@/presentation/components/forms/claim-member-form'
import { DiscoverableToggleForm } from '@/presentation/components/forms/discoverable-toggle-form'
import { ContentTabs } from '@/presentation/components/ui/content-tabs'
import { MemberPortrait } from '@/presentation/components/ui/member-portrait'
import type { Fact } from '@/presentation/mappers/fact'
import type { MemberProfileViewModel } from '@/presentation/mappers/member-view-models'
import { FactList } from '@/presentation/views/fact-list'
import { UnionRelationsView } from '@/presentation/views/union-relations-view'

type ProfileProps = Readonly<{ profile: MemberProfileViewModel }>

// reason: le JSX garde ensemble la structure sémantique, ses libellés et les états de ce composant.
export function MemberProfileView({ profile }: ProfileProps) {
  return (
    <article aria-labelledby="member-title" className="member-profile mx-auto max-w-2xl space-y-4">
      <ProfileHeader profile={profile} />
      <ContentTabs
        tabs={[
          {
            label: 'Identité',
            content: <FactSection id="identity" title="Identité" facts={profile.identity} />,
          },
          {
            label: 'Dates & Lieux',
            content: (
              <FactSection id="dates-places" title="Dates & lieux" facts={profile.datesAndPlaces} />
            ),
          },
          {
            label: 'Culture',
            content: <FactSection id="culture" title="Culture" facts={profile.culture} />,
          },
          { label: 'Bio', content: <BiographySection biography={profile.biography} /> },
        ]}
      />
      <UnionRelationsView
        parentUnions={profile.parentUnions}
        partnerUnions={profile.partnerUnions}
      />
    </article>
  )
}

function ProfileHeader({ profile }: ProfileProps) {
  return (
    <header className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
      <p>
        <Link href={profile.tree.href}>Retour à {profile.tree.name}</Link>
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <MemberPortrait portrait={profile.portrait} size="md" priority />
        <h1 id="member-title" className="text-xl font-bold sm:text-2xl">
          {profile.name}
        </h1>
      </div>
      {profile.nickname && <p>Surnom : « {profile.nickname} »</p>}
      <ProfileLinks profile={profile} />
      <ClaimSection profile={profile} />
      <DiscoverableSection profile={profile} />
    </header>
  )
}

function ClaimSection({ profile }: ProfileProps) {
  if (profile.claimedByViewer) return <p>Revendiquée par vous.</p>
  if (!profile.canClaim) return null
  return (
    <ClaimMemberForm
      action={claimMemberAction.bind(null, { treeId: profile.treeId, memberId: profile.memberId })}
    />
  )
}

function DiscoverableSection({ profile }: ProfileProps) {
  if (!profile.canToggleDiscoverable) return null
  return (
    <div className="space-y-1">
      <p className="text-sm text-earth-bark">
        {profile.discoverable
          ? 'Cette fiche peut être trouvée par d’autres personnes via la recherche globale.'
          : 'Cette fiche est privée : elle n’apparaît pas dans la recherche globale.'}
      </p>
      <DiscoverableToggleForm
        action={toggleMemberDiscoverableAction.bind(
          null,
          { treeId: profile.treeId, memberId: profile.memberId },
          !profile.discoverable,
        )}
        discoverable={profile.discoverable}
      />
    </div>
  )
}

/** Editing, deletion and new unions only appear for those allowed to use them. */
// reason: le JSX garde ensemble la structure sémantique, ses libellés et les états de ce composant.
function ProfileLinks({ profile }: ProfileProps) {
  const links = [
    { href: profile.lineageHref, label: 'Voir sa descendance dans le graphe' },
    ...optionalLink(profile.editHref, 'Modifier la fiche'),
    ...optionalLink(profile.photoHref, 'Changer la photo'),
    ...optionalLink(profile.deleteHref, 'Supprimer ce membre'),
    ...optionalLink(profile.newUnionHref, 'Ajouter une union'),
  ]
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2">
      {links.map((link) => (
        <li key={link.label}>
          <Link
            href={link.href}
            className="inline-flex min-h-8 items-center rounded-lg border border-gray-200 px-3 py-1 text-xs text-gray-700 no-underline hover:bg-gray-50"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}

function optionalLink<H extends string>(href: H | null, label: string) {
  return href ? [{ href, label }] : []
}

function BiographySection({ biography }: Readonly<{ biography: string | null }>) {
  return (
    <section aria-labelledby="biography" className="space-y-2">
      <h2 id="biography" className="sr-only">
        Biographie
      </h2>
      <p className="max-w-prose whitespace-pre-line">
        {biography ?? 'Aucune biographie renseignée.'}
      </p>
    </section>
  )
}

type FactSectionProps = Readonly<{ id: string; title: string; facts: readonly Fact[] }>

function FactSection({ id, title, facts }: FactSectionProps) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="sr-only">
        {title}
      </h2>
      <FactList facts={facts} />
    </section>
  )
}
