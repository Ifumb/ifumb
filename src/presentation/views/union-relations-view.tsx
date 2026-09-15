import Link from 'next/link'
import type { ReactNode } from 'react'
import type {
  MemberLink,
  ParentUnionViewModel,
  PartnerUnionViewModel,
  UnionHref,
} from '@/presentation/mappers/union-view-models'

type UnionRelationsViewProps = Readonly<{
  parentUnions: readonly ParentUnionViewModel[]
  partnerUnions: readonly PartnerUnionViewModel[]
}>

const UNION_ITEM_CLASS_NAME = 'rounded-lg border border-earth-sand bg-white p-4'

export function UnionRelationsView({ parentUnions, partnerUnions }: UnionRelationsViewProps) {
  return (
    <>
      <RelationSection id="parent-unions" title="Unions parentales" empty="Aucun parent renseigné.">
        {parentUnions.map((union) => (
          <ParentUnionItem key={union.id} union={union} />
        ))}
      </RelationSection>
      <RelationSection id="partner-unions" title="Parent dans" empty="Aucune union renseignée.">
        {partnerUnions.map((union) => (
          <PartnerUnionItem key={union.id} union={union} />
        ))}
      </RelationSection>
    </>
  )
}

function ParentUnionItem({ union }: Readonly<{ union: ParentUnionViewModel }>) {
  return (
    <li className={UNION_ITEM_CLASS_NAME}>
      <UnionHeading {...union} />
      <PeopleLine label="Parents" people={union.parents} fallback="Parents non renseignés" />
      <p className="text-sm">Filiation : {union.filiationLabel}</p>
    </li>
  )
}

function PartnerUnionItem({ union }: Readonly<{ union: PartnerUnionViewModel }>) {
  const partners = union.partner ? [union.partner] : []
  return (
    <li className={UNION_ITEM_CLASS_NAME}>
      <UnionHeading {...union} />
      <PeopleLine label="Avec" people={partners} fallback="Seul parent renseigné" />
      <ChildrenLine childrenLinks={union.children} />
    </li>
  )
}

type RelationSectionProps = Readonly<{
  id: string
  title: string
  empty: string
  children: readonly ReactNode[]
}>

function RelationSection({ id, title, empty, children }: RelationSectionProps) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-xl font-bold">
        {title}
      </h2>
      {children.length > 0 ? <ul className="space-y-3">{children}</ul> : <p>{empty}</p>}
    </section>
  )
}

type UnionHeadingProps = Readonly<{ href: UnionHref; typeLabel: string; datesLabel: string | null }>

/** The union's type and dates, linking to the union itself. */
function UnionHeading({ href, typeLabel, datesLabel }: UnionHeadingProps) {
  return (
    <p className="font-semibold">
      <Link href={href}>{typeLabel}</Link>
      {datesLabel && <span className="font-normal"> ({datesLabel})</span>}
    </p>
  )
}

type PeopleLineProps = Readonly<{ label: string; people: readonly MemberLink[]; fallback: string }>

function PeopleLine({ label, people, fallback }: PeopleLineProps) {
  if (people.length === 0) return <p className="text-sm">{fallback}</p>
  return (
    <p className="text-sm">
      {label} :{' '}
      {people.map((person, index) => (
        <span key={person.href}>
          {index > 0 && ' et '}
          <Link href={person.href}>{person.name}</Link>
        </span>
      ))}
    </p>
  )
}

function ChildrenLine({
  childrenLinks,
}: Readonly<{ childrenLinks: PartnerUnionViewModel['children'] }>) {
  if (childrenLinks.length === 0) return <p className="text-sm">Aucun enfant renseigné</p>
  return (
    <div className="text-sm">
      <p>Enfants :</p>
      <ul className="list-disc pl-5">
        {childrenLinks.map((child) => (
          <li key={child.href}>
            <Link href={child.href}>{child.name}</Link> ({child.filiationLabel})
          </li>
        ))}
      </ul>
    </div>
  )
}
