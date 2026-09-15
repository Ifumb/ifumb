import type { Metadata } from 'next'
import Link from 'next/link'
import { createUnionAction } from '@/app/actions/union-actions'
import { loadUnionForm } from '@/app/tree/[id]/union/[unionId]/load-union'
import { UnionWriteRefusal } from '@/app/tree/[id]/union/[unionId]/union-write-refusal'
import type { UnionForm as UnionFormData } from '@/core/use-cases/get-union-form'
import { UnionForm } from '@/presentation/components/forms/union-form'
import { CREATE_UNION_SUBMIT, memberOption, newUnionValues } from '@/presentation/forms/union-form'
import { parseNewUnionParent } from '@/presentation/schemas/union-form-schema'

type NewUnionPageProps = Readonly<{
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}>

export const metadata: Metadata = { title: 'Créer une union', robots: { index: false } }

export default async function NewUnionPage({ params, searchParams }: NewUnionPageProps) {
  const { id } = await params
  const result = await loadUnionForm(id)
  if (!result.ok) return <UnionWriteRefusal treeId={id} error={result.error} />
  return <NewUnion form={result.value} parentId={parseNewUnionParent(await searchParams)} />
}

type NewUnionProps = Readonly<{ form: UnionFormData; parentId: string | null }>

function NewUnion({ form, parentId }: NewUnionProps) {
  const treeHref = `/tree/${form.tree.id}` as const
  return (
    <section aria-labelledby="new-union-title" className="space-y-6">
      <p>
        <Link href={treeHref}>Retour à {form.tree.name}</Link>
      </p>
      <h1 id="new-union-title" className="text-3xl font-bold">
        Créer une union
      </h1>
      {form.members.length === 0 ? (
        <NoMemberYet treeId={form.tree.id} />
      ) : (
        <NewUnionForm form={form} parentId={parentId} />
      )}
    </section>
  )
}

/** The parent given in the URL is kept only when it is a member of this tree. */
function NewUnionForm({ form, parentId }: NewUnionProps) {
  const knownParent = form.members.some((member) => member.id === parentId) ? parentId : null
  return (
    <UnionForm
      action={createUnionAction.bind(null, form.tree.id)}
      members={form.members.map(memberOption)}
      initialValues={newUnionValues(knownParent)}
      submit={CREATE_UNION_SUBMIT}
    />
  )
}

function NoMemberYet({ treeId }: Readonly<{ treeId: string }>) {
  return (
    <p>
      Une union relie des membres de l’arbre.{' '}
      <Link href={`/tree/${treeId}/members/new`}>Ajoutez d’abord un membre</Link>.
    </p>
  )
}
