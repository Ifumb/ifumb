import Link from 'next/link'
import type { ReactNode } from 'react'
import { AddUnionChildForm } from '@/presentation/components/forms/add-union-child-form'
import { UnionChildrenList } from '@/presentation/components/forms/union-children-list'
import type { FormAction } from '@/presentation/forms/form-action'
import type {
  UnionManagementViewModel,
  UnionPageViewModel,
} from '@/presentation/mappers/union-page-view-models'
import { FactList } from '@/presentation/views/fact-list'

/** The Server Actions offered to the owner, bound to this union by the page. */
export type UnionChildActions = { readonly add: FormAction; readonly remove: FormAction }

type UnionPageViewProps = Readonly<{ union: UnionPageViewModel; actions: UnionChildActions | null }>

export function UnionPageView({ union, actions }: UnionPageViewProps) {
  const management = actions && union.management
  return (
    <article aria-labelledby="union-title" className="max-w-3xl space-y-8">
      <UnionHeader union={union} />
      <Section id="union-parents" title="Parents">
        <PeopleList union={union} />
      </Section>
      <Section id="union-children" title="Enfants">
        {management ? (
          <UnionChildrenList removeAction={actions.remove} childLinks={union.children} />
        ) : (
          <ReadOnlyChildren union={union} />
        )}
      </Section>
      {management && <AddChildSection management={management} add={actions.add} />}
    </article>
  )
}

function UnionHeader({ union }: Readonly<{ union: UnionPageViewModel }>) {
  const facts = [
    { term: 'Type', detail: union.typeLabel },
    { term: 'Dates', detail: union.datesLabel ?? 'Non renseignées' },
  ]
  return (
    <header className="space-y-3">
      <p>
        <Link href={union.tree.href}>Retour à {union.tree.name}</Link>
      </p>
      <h1 id="union-title" className="text-3xl font-bold">
        {union.title}
      </h1>
      <FactList facts={facts} />
      {union.management && <ManagementLinks management={union.management} />}
    </header>
  )
}

function ManagementLinks({ management }: Readonly<{ management: UnionManagementViewModel }>) {
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2">
      <li>
        <Link href={management.editHref}>Modifier l’union</Link>
      </li>
      <li>
        <Link href={management.deleteHref}>Supprimer l’union</Link>
      </li>
    </ul>
  )
}

function PeopleList({ union }: Readonly<{ union: UnionPageViewModel }>) {
  if (union.parents.length === 0) return <p>Aucun parent renseigné.</p>
  return (
    <ul className="list-disc space-y-1 pl-5">
      {union.parents.map((parent) => (
        <li key={parent.href}>
          <Link href={parent.href}>{parent.name}</Link>
        </li>
      ))}
      {union.parents.length === 1 && <li>Second parent inconnu</li>}
    </ul>
  )
}

function ReadOnlyChildren({ union }: Readonly<{ union: UnionPageViewModel }>) {
  if (union.children.length === 0) return <p>Aucun enfant rattaché.</p>
  return (
    <ul className="list-disc space-y-1 pl-5">
      {union.children.map((child) => (
        <li key={child.id}>
          <Link href={child.href}>{child.name}</Link> ({child.filiationLabel})
        </li>
      ))}
    </ul>
  )
}

type AddChildSectionProps = Readonly<{ management: UnionManagementViewModel; add: FormAction }>

function AddChildSection({ management, add }: AddChildSectionProps) {
  return (
    <Section id="union-add-child" title="Ajouter un enfant">
      <AddUnionChildForm action={add} childOptions={management.childOptions} />
    </Section>
  )
}

function Section({
  id,
  title,
  children,
}: Readonly<{ id: string; title: string; children: ReactNode }>) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-xl font-bold">
        {title}
      </h2>
      {children}
    </section>
  )
}
