import type { Metadata } from 'next'
import { deleteMemberAction } from '@/app/actions/member-actions'
import { loadMemberForm } from '@/app/tree/[id]/member/[memberId]/load-member-form'
import { MemberWriteRefusal } from '@/app/tree/[id]/member/[memberId]/member-write-refusal'
import type { MemberForm } from '@/core/use-cases/get-member-form'
import { ConfirmDeletionForm } from '@/presentation/components/forms/confirm-deletion-form'
import { memberLink } from '@/presentation/mappers/union-view-models'

type DeleteMemberPageProps = Readonly<{ params: Promise<{ id: string; memberId: string }> }>

export const metadata: Metadata = { title: 'Supprimer un membre', robots: { index: false } }

export default async function DeleteMemberPage({ params }: DeleteMemberPageProps) {
  const { id, memberId } = await params
  const result = await loadMemberForm(id, memberId)
  if (!result.ok) return <MemberWriteRefusal treeId={id} error={result.error} />
  if (!result.value.canDelete) {
    return <MemberWriteRefusal treeId={id} error={{ kind: 'MEMBER_MANAGEMENT_FORBIDDEN' }} />
  }
  return <DeleteConfirmation form={result.value} />
}

function DeleteConfirmation({ form }: Readonly<{ form: MemberForm }>) {
  const { href, name } = memberLink(form.tree.id, form.member)
  const target = { treeId: form.tree.id, memberId: form.member.id }
  return (
    <section aria-labelledby="delete-member-title" className="max-w-prose space-y-4">
      <h1 id="delete-member-title" className="text-3xl font-bold">
        Supprimer {name} ?
      </h1>
      <p>
        La fiche sera retirée de l’arbre {form.tree.name}, avec ses liens de parent et d’enfant. La
        suppression est inscrite au journal de l’arbre et ne peut pas être annulée.
      </p>
      <ConfirmDeletionForm
        action={deleteMemberAction.bind(null, target)}
        cancel={{ href, label: 'Annuler et revenir à la fiche' }}
      />
    </section>
  )
}
