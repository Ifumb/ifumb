import Link from 'next/link'
import type { Fact } from '@/presentation/mappers/fact'
import type { MemberProfileViewModel } from '@/presentation/mappers/member-view-models'
import { FactList } from '@/presentation/views/fact-list'
import { UnionRelationsView } from '@/presentation/views/union-relations-view'

type ProfileProps = Readonly<{ profile: MemberProfileViewModel }>

export function MemberProfileView({ profile }: ProfileProps) {
  return (
    <article aria-labelledby="member-title" className="space-y-8">
      <ProfileHeader profile={profile} />
      <div className="grid gap-6 md:grid-cols-3">
        <FactSection id="identity" title="Identité" facts={profile.identity} />
        <FactSection id="dates-places" title="Dates & lieux" facts={profile.datesAndPlaces} />
        <FactSection id="culture" title="Culture" facts={profile.culture} />
      </div>
      <BiographySection biography={profile.biography} />
      <UnionRelationsView
        parentUnions={profile.parentUnions}
        partnerUnions={profile.partnerUnions}
      />
    </article>
  )
}

function ProfileHeader({ profile }: ProfileProps) {
  return (
    <header className="space-y-2">
      <p>
        <Link href={profile.tree.href}>Retour à {profile.tree.name}</Link>
      </p>
      <h1 id="member-title" className="text-3xl font-bold">
        {profile.name}
      </h1>
      {profile.nickname && <p>Surnom : « {profile.nickname} »</p>}
      <ProfileLinks profile={profile} />
    </header>
  )
}

/** Editing, deletion and new unions only appear for those allowed to use them. */
function ProfileLinks({ profile }: ProfileProps) {
  const links = [
    { href: profile.lineageHref, label: 'Voir sa descendance dans le graphe' },
    ...optionalLink(profile.editHref, 'Modifier la fiche'),
    ...optionalLink(profile.deleteHref, 'Supprimer ce membre'),
    ...optionalLink(profile.newUnionHref, 'Ajouter une union'),
  ]
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2">
      {links.map((link) => (
        <li key={link.label}>
          <Link href={link.href}>{link.label}</Link>
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
      <h2 id="biography" className="text-xl font-bold">
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
    <section
      aria-labelledby={id}
      className="space-y-2 rounded-lg border border-earth-sand bg-white p-4"
    >
      <h2 id={id} className="text-xl font-bold">
        {title}
      </h2>
      <FactList facts={facts} />
    </section>
  )
}
