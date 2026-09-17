import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { revokeInvitationAction } from '@/app/actions/invitation-actions'
import type { TreeManagementError } from '@/core/use-cases/tree-management-access'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import { RevokeInvitationForm } from '@/presentation/components/forms/revoke-invitation-form'
import { toCollaboratorsViewModel } from '@/presentation/mappers/collaborator-view-models'
import { PrivateTreeView } from '@/presentation/views/private-tree-view'
import { RestrictedTreeView } from '@/presentation/views/restricted-tree-view'

type RevokePageProps = Readonly<{ params: Promise<{ id: string; invitationId: string }> }>

export const metadata: Metadata = { title: 'Révoquer un accès', robots: { index: false } }

export default async function RevokeInvitationPage({ params }: RevokePageProps) {
  const { id, invitationId } = await params
  const currentUser = await requireCurrentUser()
  const result = await container.listCollaborators().execute({ treeId: id, viewerId: currentUser.id })
  if (!result.ok) return unmanageableTree(id, result.error)

  const list = toCollaboratorsViewModel(id, result.value)
  const collaborator = list.collaborators.find((entry) => entry.id === invitationId)
  if (!collaborator) notFound()

  return (
    <section aria-labelledby="revoke-title" className="max-w-prose space-y-4">
      <h1 id="revoke-title" className="text-3xl font-bold">
        Révoquer l’accès de {collaborator.displayName} ?
      </h1>
      <p>
        {collaborator.displayName} ne pourra plus accéder à {list.treeName}. Ses propositions encore
        en attente sur cet arbre seront rejetées. Cette action ne peut pas être annulée.
      </p>
      <RevokeInvitationForm
        action={revokeInvitationAction.bind(null, { treeId: id, invitationId })}
        cancelHref={`/tree/${id}/collaborators`}
      />
    </section>
  )
}

function unmanageableTree(treeId: string, error: TreeManagementError) {
  switch (error.kind) {
    case 'TREE_NOT_FOUND':
      notFound()
    case 'TREE_MANAGEMENT_FORBIDDEN':
      return (
        <RestrictedTreeView
          title="Réservé au propriétaire"
          treeHref={`/tree/${treeId}`}
          signedIn
          message="Seul le propriétaire de l’arbre peut gérer ses collaborateurs."
        />
      )
    default:
      return <PrivateTreeView signedIn />
  }
}
