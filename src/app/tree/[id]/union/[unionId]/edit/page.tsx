import type { Metadata } from 'next'
import Link from 'next/link'
import { updateUnionAction } from '@/app/actions/union-actions'
import { loadUnionForm } from '@/app/tree/[id]/union/[unionId]/load-union'
import { UnionWriteRefusal } from '@/app/tree/[id]/union/[unionId]/union-write-refusal'
import type { UnionForm as UnionFormData } from '@/core/use-cases/get-union-form'
import type { UnionDetails } from '@/core/use-cases/union-views'
import { UnionForm } from '@/presentation/components/forms/union-form'
import { memberOption, unionFormValues, UPDATE_UNION_SUBMIT } from '@/presentation/forms/union-form'
import { unionHref } from '@/presentation/mappers/union-view-models'

type EditUnionPageProps = Readonly<{ params: Promise<{ id: string; unionId: string }> }>

export const metadata: Metadata = { title: 'Modifier une union', robots: { index: false } }

export default async function EditUnionPage({ params }: EditUnionPageProps) {
  const { id, unionId } = await params
  const result = await loadUnionForm(id, unionId)
  if (!result.ok) return <UnionWriteRefusal treeId={id} error={result.error} />
  const { union } = result.value
  // A form read with a union id always carries that union.
  return union ? <EditUnion form={result.value} union={union} /> : null
}

type EditUnionProps = Readonly<{ form: UnionFormData; union: UnionDetails }>

function EditUnion({ form, union }: EditUnionProps) {
  const target = { treeId: form.tree.id, unionId: union.id }
  return (
    <section aria-labelledby="edit-union-title" className="space-y-6">
      <p>
        <Link href={unionHref(target.treeId, target.unionId)}>Retour à l’union</Link>
      </p>
      <h1 id="edit-union-title" className="text-3xl font-bold">
        Modifier l’union
      </h1>
      <UnionForm
        action={updateUnionAction.bind(null, target)}
        members={form.members.map(memberOption)}
        initialValues={unionFormValues(union)}
        submit={UPDATE_UNION_SUBMIT}
      />
    </section>
  )
}
