import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createMemberAction } from '@/app/actions/member-actions'
import { canContribute } from '@/core/entities/tree'
import type { GetTreeOverviewError } from '@/core/use-cases/get-tree-overview'
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
  // reason: the owner and an editor both reach the form — the owner adds directly, an editor
  // proposes (module 2.6); only a viewer, who contributes nothing, is turned away.
  const result = await container.getTreeOverview().execute({ treeId: id, viewerId: currentUser.id })
  if (!result.ok) return memberCreationRefused(id, result.error)
  if (!canContribute(result.value.role)) {
    return memberCreationRefused(id, { kind: 'ACCESS_DENIED' })
  }

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

function memberCreationRefused(treeId: string, error: GetTreeOverviewError) {
  switch (error.kind) {
    case 'TREE_NOT_FOUND':
      notFound()
    case 'ACCESS_DENIED':
      return (
        <RestrictedTreeView
          title="Réservé aux contributeurs"
          treeHref={`/tree/${treeId}`}
          signedIn
          message="Seuls le propriétaire de l’arbre et ses éditeurs peuvent y ajouter un membre."
        />
      )
    default:
      return <PrivateTreeView signedIn />
  }
}
