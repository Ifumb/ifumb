import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createMemberAction } from '@/app/actions/member-actions'
import type { TreeManagementError } from '@/core/use-cases/tree-management-access'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import { MemberForm } from '@/presentation/components/forms/member-form'
import { CREATE_MEMBER_SUBMIT, NEW_MEMBER_VALUES } from '@/presentation/forms/member-form'
import { PrivateTreeView } from '@/presentation/views/private-tree-view'
import { RestrictedTreeView } from '@/presentation/views/restricted-tree-view'

type NewMemberPageProps = Readonly<{ params: Promise<{ id: string }> }>

export const metadata: Metadata = { title: 'Ajouter un membre', robots: { index: false } }

export default async function NewMemberPage({ params }: NewMemberPageProps) {
  const { id } = await params
  const currentUser = await requireCurrentUser()
  // reason: adding a member is the owner's right (canAddMember), the same check as the settings.
  const result = await container.getTreeSettings().execute({ treeId: id, viewerId: currentUser.id })
  if (!result.ok) return memberCreationRefused(id, result.error)

  return <NewMember treeId={id} treeName={result.value.name} />
}

function NewMember({ treeId, treeName }: Readonly<{ treeId: string; treeName: string }>) {
  return (
    <section aria-labelledby="new-member-title" className="space-y-6">
      <p>
        <Link href={`/tree/${treeId}`}>Retour à {treeName}</Link>
      </p>
      <h1 id="new-member-title" className="text-3xl font-bold">
        Ajouter un membre
      </h1>
      <MemberForm
        action={createMemberAction.bind(null, treeId)}
        initialValues={NEW_MEMBER_VALUES}
        submit={CREATE_MEMBER_SUBMIT}
      />
    </section>
  )
}

function memberCreationRefused(treeId: string, error: TreeManagementError) {
  switch (error.kind) {
    case 'TREE_NOT_FOUND':
      notFound()
    case 'TREE_MANAGEMENT_FORBIDDEN':
      return (
        <RestrictedTreeView
          title="Réservé au propriétaire"
          treeHref={`/tree/${treeId}`}
          signedIn
          message="Seul le propriétaire de l’arbre peut y ajouter un membre."
        />
      )
    default:
      return <PrivateTreeView signedIn />
  }
}
