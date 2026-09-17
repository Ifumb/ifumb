import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadConnectionRequests } from '@/app/tree/[id]/connection-requests/load-connection-requests'
import { loadTreeOverview } from '@/app/tree/[id]/load-tree-overview'
import type { GetTreeOverviewError } from '@/core/use-cases/get-tree-overview'
import type { TreeManagementError } from '@/core/use-cases/tree-management-access'
import { toConnectionRequestItems } from '@/presentation/mappers/connection-request-view-models'
import { parseConnectionRequestResult } from '@/presentation/schemas/cross-tree-review-schema'
import { ConnectionRequestsView } from '@/presentation/views/connection-requests-view'
import { PrivateTreeView } from '@/presentation/views/private-tree-view'
import { RestrictedTreeView } from '@/presentation/views/restricted-tree-view'

type ConnectionRequestsPageProps = Readonly<{
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}>

export async function generateMetadata({ params }: ConnectionRequestsPageProps): Promise<Metadata> {
  const { result } = await loadTreeOverview((await params).id)
  if (!result.ok) {
    const title = result.error.kind === 'TREE_NOT_FOUND' ? 'Arbre introuvable' : 'Arbre privé'
    return { title, robots: { index: false } }
  }
  return { title: `Demandes de connexion — ${result.value.name}`, robots: { index: false } }
}

export default async function ConnectionRequestsPage({
  params,
  searchParams,
}: ConnectionRequestsPageProps) {
  const { id } = await params
  const overview = await loadTreeOverview(id)
  if (!overview.result.ok) return unreadableTree(overview.result.error, overview.signedIn)

  const { signedIn, result } = await loadConnectionRequests(id)
  if (!result.ok) return unreadableConnectionRequests(id, result.error, signedIn)

  const query = await searchParams
  return (
    <ConnectionRequestsView
      treeId={id}
      treeName={overview.result.value.name}
      treeHref={`/tree/${id}`}
      items={toConnectionRequestItems(result.value)}
      result={parseConnectionRequestResult(query)}
    />
  )
}

function unreadableTree(error: GetTreeOverviewError, signedIn: boolean) {
  if (error.kind === 'TREE_NOT_FOUND') notFound()
  return <PrivateTreeView signedIn={signedIn} />
}

function unreadableConnectionRequests(
  treeId: string,
  error: TreeManagementError,
  signedIn: boolean,
) {
  switch (error.kind) {
    case 'TREE_NOT_FOUND':
      notFound()
    case 'TREE_MANAGEMENT_FORBIDDEN':
      return (
        <RestrictedTreeView
          title="Réservé au propriétaire"
          message="Les demandes de connexion sont réservées au propriétaire de l’arbre."
          treeHref={`/tree/${treeId}`}
          signedIn={signedIn}
        />
      )
    default:
      return <PrivateTreeView signedIn={signedIn} />
  }
}
