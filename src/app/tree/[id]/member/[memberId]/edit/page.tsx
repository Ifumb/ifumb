import type { Metadata } from 'next'
import Link from 'next/link'
import { updateMemberAction } from '@/app/actions/member-actions'
import { loadMemberForm } from '@/app/tree/[id]/member/[memberId]/load-member-form'
import { MemberWriteRefusal } from '@/app/tree/[id]/member/[memberId]/member-write-refusal'
import type { MemberForm as EditableMember } from '@/core/use-cases/get-member-form'
import { MemberForm } from '@/presentation/components/forms/member-form'
import { memberFormValues, UPDATE_MEMBER_SUBMIT } from '@/presentation/forms/member-form'
import { memberLink } from '@/presentation/mappers/union-view-models'

type EditMemberPageProps = Readonly<{ params: Promise<{ id: string; memberId: string }> }>

export async function generateMetadata({ params }: EditMemberPageProps): Promise<Metadata> {
  const { id, memberId } = await params
  const result = await loadMemberForm(id, memberId)
  const name = result.ok ? memberLink(id, result.value.member).name : null
  return { title: name ? `Modifier — ${name}` : 'Modifier un membre', robots: { index: false } }
}

export default async function EditMemberPage({ params }: EditMemberPageProps) {
  const { id, memberId } = await params
  const result = await loadMemberForm(id, memberId)
  if (!result.ok) return <MemberWriteRefusal treeId={id} error={result.error} />
  return <EditMember form={result.value} />
}

// reason: le JSX garde ensemble la structure sémantique, ses libellés et les états de ce composant.
function EditMember({ form }: Readonly<{ form: EditableMember }>) {
  const { href, name } = memberLink(form.tree.id, form.member)
  const target = { treeId: form.tree.id, memberId: form.member.id }
  return (
    <section
      aria-labelledby="edit-member-title"
      className="mx-auto max-w-2xl space-y-6 rounded-2xl bg-white p-5 shadow-sm"
    >
      <p>
        <Link href={href}>Retour à la fiche de {name}</Link>
      </p>
      <h1 id="edit-member-title" className="text-xl font-bold">
        Modifier la fiche de {name}
      </h1>
      <MemberForm
        action={updateMemberAction.bind(null, target)}
        initialValues={memberFormValues(form.member)}
        submit={UPDATE_MEMBER_SUBMIT}
      />
    </section>
  )
}
