import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadPendingChanges } from '@/app/tree/[id]/pending/load-pending-changes'
import { reviewAllPendingChangesAction } from '@/app/actions/review-actions'
import { ReviewAllForm } from '@/presentation/components/forms/review-all-form'
import { PrivateTreeView } from '@/presentation/views/private-tree-view'
import { RestrictedTreeView } from '@/presentation/views/restricted-tree-view'

type RejectAllPageProps = Readonly<{ params: Promise<{ id: string }> }>

export const metadata: Metadata = { title: 'Tout rejeter', robots: { index: false } }

export default async function RejectAllPage({ params }: RejectAllPageProps) {
  const { id } = await params
  const { signedIn, result } = await loadPendingChanges(id)

  if (!result.ok) {
    if (result.error.kind === 'TREE_NOT_FOUND') notFound()
    return <PrivateTreeView signedIn={signedIn} />
  }
  if (!result.value.canReview) {
    return (
      <RestrictedTreeView
        title="Réservé au propriétaire"
        message="Seul le propriétaire de l’arbre peut rejeter les propositions."
        treeHref={`/tree/${id}`}
        signedIn={signedIn}
      />
    )
  }

  const pendingCount = result.value.changes.length
  return (
    <section aria-labelledby="reject-all-title" className="max-w-prose space-y-4">
      <h1 id="reject-all-title" className="text-3xl font-bold">
        Tout rejeter ?
      </h1>
      <p>
        Les {pendingCount} modification{pendingCount > 1 ? 's' : ''} en attente sur{' '}
        {result.value.tree.name} seront rejetées, avec le même commentaire pour chacune. Leurs
        auteurs en seront informés.
      </p>
      <ReviewAllForm
        action={reviewAllPendingChangesAction.bind(null, { treeId: id, decision: 'REJECTED' })}
        submitLabel="Tout rejeter"
        cancelHref={`/tree/${id}/pending`}
        withComment
      />
    </section>
  )
}
