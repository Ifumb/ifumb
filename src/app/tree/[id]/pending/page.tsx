import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadPendingChanges } from '@/app/tree/[id]/pending/load-pending-changes'
import { loadTreeOverview } from '@/app/tree/[id]/load-tree-overview'
import type { GetPendingChangesError } from '@/core/use-cases/get-pending-changes'
import { toPendingChangesViewModel } from '@/presentation/mappers/pending-change-view-models'
import { PendingChangesView } from '@/presentation/views/pending-changes-view'
import { PrivateTreeView } from '@/presentation/views/private-tree-view'
import { RestrictedTreeView } from '@/presentation/views/restricted-tree-view'

type PendingPageProps = Readonly<{ params: Promise<{ id: string }> }>

export async function generateMetadata({ params }: PendingPageProps): Promise<Metadata> {
  const { result } = await loadTreeOverview((await params).id)
  if (!result.ok) {
    const title = result.error.kind === 'TREE_NOT_FOUND' ? 'Arbre introuvable' : 'Arbre privé'
    return { title, robots: { index: false } }
  }
  return {
    title: `Modifications en attente — ${result.value.name}`,
    robots: { index: false },
  }
}

export default async function PendingChangesPage({ params }: PendingPageProps) {
  const { id } = await params
  const { signedIn, result } = await loadPendingChanges(id)

  if (result.ok) return <PendingChangesView list={toPendingChangesViewModel(result.value)} />
  return unreadablePendingChanges(id, result.error, signedIn)
}

function unreadablePendingChanges(
  treeId: string,
  error: GetPendingChangesError,
  signedIn: boolean,
) {
  switch (error.kind) {
    case 'TREE_NOT_FOUND':
      notFound()
    case 'PENDING_CHANGES_FORBIDDEN':
      return (
        <RestrictedTreeView
          title="Réservé aux contributeurs"
          message="Les modifications en attente sont réservées au propriétaire de l’arbre et à ses éditeurs."
          treeHref={`/tree/${treeId}`}
          signedIn={signedIn}
        />
      )
    default:
      return <PrivateTreeView signedIn={signedIn} />
  }
}
