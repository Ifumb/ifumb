import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { sendInvitationAction } from '@/app/actions/invitation-actions'
import { loadTreeOverview } from '@/app/tree/[id]/load-tree-overview'
import type { TreeManagementError } from '@/core/use-cases/tree-management-access'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import { InviteForm } from '@/presentation/components/forms/invite-form'
import { CollaboratorsView } from '@/presentation/views/collaborators-view'
import { toCollaboratorsViewModel } from '@/presentation/mappers/collaborator-view-models'
import { PrivateTreeView } from '@/presentation/views/private-tree-view'
import { RestrictedTreeView } from '@/presentation/views/restricted-tree-view'

type CollaboratorsPageProps = Readonly<{
  params: Promise<{ id: string }>
  searchParams: Promise<{ invite?: string }>
}>

export async function generateMetadata({ params }: CollaboratorsPageProps): Promise<Metadata> {
  const { result } = await loadTreeOverview((await params).id)
  const title = result.ok ? `Collaborateurs — ${result.value.name}` : 'Collaborateurs'
  return { title, robots: { index: false } }
}

// reason: le JSX garde ensemble la structure sémantique, ses libellés et les états de ce composant.
export default async function CollaboratorsPage({ params, searchParams }: CollaboratorsPageProps) {
  const { id } = await params
  const currentUser = await requireCurrentUser()
  const result = await container
    .listCollaborators()
    .execute({ treeId: id, viewerId: currentUser.id })
  if (!result.ok) return unmanageableTree(id, result.error)

  if ((await searchParams).invite === '1')
    return (
      <section aria-labelledby="invite-title" className="space-y-5">
        <h1 id="invite-title" className="text-xl font-semibold">
          Inviter un collaborateur
        </h1>
        <InviteForm action={sendInvitationAction.bind(null, id)} />
      </section>
    )
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
