import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadPendingChanges } from '@/app/tree/[id]/pending/load-pending-changes'
import { reviewAllPendingChangesAction } from '@/app/actions/review-actions'
import { ReviewAllForm } from '@/presentation/components/forms/review-all-form'
import { PrivateTreeView } from '@/presentation/views/private-tree-view'
import { RestrictedTreeView } from '@/presentation/views/restricted-tree-view'

type ApproveAllPageProps = Readonly<{ params: Promise<{ id: string }> }>

export const metadata: Metadata = { title: 'Tout approuver', robots: { index: false } }

export default async function ApproveAllPage({ params }: ApproveAllPageProps) {
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
        message="Seul le propriétaire de l’arbre peut approuver les propositions."
        treeHref={`/tree/${id}`}
        signedIn={signedIn}
      />
    )
  }

  const pendingCount = result.value.changes.length
  return (
    <section aria-labelledby="approve-all-title" className="max-w-prose space-y-4">
      <h1 id="approve-all-title" className="text-3xl font-bold">
        Tout approuver ?
      </h1>
      <p>
        Les {pendingCount} modification{pendingCount > 1 ? 's' : ''} en attente sur{' '}
        {result.value.tree.name} seront appliquées telles quelles, sauf celles devenues
        impossibles depuis (fiche modifiée entre-temps, ou déjà résolue) — celles-ci resteront en
        attente.
      </p>
      <ReviewAllForm
        action={reviewAllPendingChangesAction.bind(null, { treeId: id, decision: 'APPROVED' })}
        submitLabel="Tout approuver"
        cancelHref={`/tree/${id}/pending`}
        withComment={false}
      />
    </section>
  )
}
