import type { Metadata } from 'next'
import { deleteUnionAction } from '@/app/actions/union-actions'
import { loadUnion } from '@/app/tree/[id]/union/[unionId]/load-union'
import { UnionWriteRefusal } from '@/app/tree/[id]/union/[unionId]/union-write-refusal'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { ConfirmDeletionForm } from '@/presentation/components/forms/confirm-deletion-form'
import {
  toUnionPageViewModel,
  type UnionPageViewModel,
} from '@/presentation/mappers/union-page-view-models'
import { unionHref } from '@/presentation/mappers/union-view-models'

type DeleteUnionPageProps = Readonly<{ params: Promise<{ id: string; unionId: string }> }>

export const metadata: Metadata = { title: 'Supprimer une union', robots: { index: false } }

export default async function DeleteUnionPage({ params }: DeleteUnionPageProps) {
  const { id, unionId } = await params
  await requireCurrentUser()
  const { result } = await loadUnion(id, unionId)
  if (!result.ok) return <UnionWriteRefusal treeId={id} error={result.error} />
  if (!result.value.canManage) {
    return <UnionWriteRefusal treeId={id} error={{ kind: 'UNION_MANAGEMENT_FORBIDDEN' }} />
  }
  const target = { treeId: id, unionId }
  return <DeleteConfirmation union={toUnionPageViewModel(result.value)} target={target} />
}

type DeleteConfirmationProps = Readonly<{
  union: UnionPageViewModel
  target: { readonly treeId: string; readonly unionId: string }
}>

function DeleteConfirmation({ union, target }: DeleteConfirmationProps) {
  return (
    <section aria-labelledby="delete-union-title" className="max-w-prose space-y-4">
      <h1 id="delete-union-title" className="text-3xl font-bold">
        Supprimer l’union ?
      </h1>
      <p className="font-semibold">
        {union.title} — {union.typeLabel}
      </p>
      <DeletionConsequences union={union} />
      <ConfirmDeletionForm
        action={deleteUnionAction.bind(null, target)}
        cancel={{
          href: unionHref(target.treeId, target.unionId),
          label: 'Annuler et revenir à l’union',
        }}
      />
    </section>
  )
}

/** Who loses a parent link; the members themselves stay in the tree. */
function DeletionConsequences({ union }: Readonly<{ union: UnionPageViewModel }>) {
  const childNames = union.children.map((child) => child.name).join(', ')
  return (
    <p>
      {childNames
        ? `Ces membres perdront ce lien de parenté, mais resteront dans l’arbre : ${childNames}.`
        : 'Aucun enfant n’est rattaché à cette union ; ses parents restent dans l’arbre.'}{' '}
      La suppression est inscrite au journal de l’arbre et ne peut pas être annulée.
    </p>
  )
}
