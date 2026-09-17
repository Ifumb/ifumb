import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { updateTreeAction } from '@/app/actions/tree-actions'
import { loadTreeOverview } from '@/app/tree/[id]/load-tree-overview'
import type { TreeSettings } from '@/core/use-cases/get-tree-settings'
import type { TreeManagementError } from '@/core/use-cases/tree-management-access'
import { requireCurrentUser } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import { TreeForm } from '@/presentation/components/forms/tree-form'
import { UPDATE_TREE_SUBMIT } from '@/presentation/forms/tree-form'
import { PrivateTreeView } from '@/presentation/views/private-tree-view'
import { RestrictedTreeView } from '@/presentation/views/restricted-tree-view'

type SettingsPageProps = Readonly<{ params: Promise<{ id: string }> }>

export async function generateMetadata({ params }: SettingsPageProps): Promise<Metadata> {
  const { result } = await loadTreeOverview((await params).id)
  const title = result.ok ? `Modifier — ${result.value.name}` : 'Modifier un arbre'
  return { title, robots: { index: false } }
}

export default async function TreeSettingsPage({ params }: SettingsPageProps) {
  const { id } = await params
  const currentUser = await requireCurrentUser()
  const result = await container.getTreeSettings().execute({ treeId: id, viewerId: currentUser.id })
  return result.ok ? <TreeSettings settings={result.value} /> : unmanageableTree(id, result.error)
}

function TreeSettings({ settings }: Readonly<{ settings: TreeSettings }>) {
  const { id, name, description, visibility } = settings
  return (
    <section aria-labelledby="tree-settings-title" className="space-y-6">
      <p>
        <Link href={`/tree/${id}`}>Retour à {name}</Link>
      </p>
      <h1 id="tree-settings-title" className="text-3xl font-bold">
        Modifier l’arbre
      </h1>
      <TreeForm
        action={updateTreeAction.bind(null, id)}
        submit={UPDATE_TREE_SUBMIT}
        initialValues={{ name, description: description ?? '', visibility }}
      />
      <p>
        <Link href={`/tree/${id}/collaborators`}>Gérer les collaborateurs</Link>
      </p>
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
          message="Seul le propriétaire de l’arbre peut modifier son nom, sa description et sa visibilité."
        />
      )
    default:
      return <PrivateTreeView signedIn />
  }
}
