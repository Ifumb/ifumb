import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { sendInvitationAction } from '@/app/actions/invitation-actions'
import { loadTreeOverview } from '@/app/tree/[id]/load-tree-overview'
import type { TreeManagementError } from '@/core/use-cases/tree-management-access'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import { CollaboratorsView } from '@/presentation/views/collaborators-view'
import { toCollaboratorsViewModel } from '@/presentation/mappers/collaborator-view-models'
import { PrivateTreeView } from '@/presentation/views/private-tree-view'
import { RestrictedTreeView } from '@/presentation/views/restricted-tree-view'

type CollaboratorsPageProps = Readonly<{ params: Promise<{ id: string }> }>

export async function generateMetadata({ params }: CollaboratorsPageProps): Promise<Metadata> {
  const { result } = await loadTreeOverview((await params).id)
  const title = result.ok ? `Collaborateurs — ${result.value.name}` : 'Collaborateurs'
  return { title, robots: { index: false } }
}

export default async function CollaboratorsPage({ params }: CollaboratorsPageProps) {
  const { id } = await params
  const currentUser = await requireCurrentUser()
  const result = await container.listCollaborators().execute({ treeId: id, viewerId: currentUser.id })
  if (!result.ok) return unmanageableTree(id, result.error)

  return (
    <CollaboratorsView
      list={toCollaboratorsViewModel(id, result.value)}
      sendInvitationAction={sendInvitationAction.bind(null, id)}
    />
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
