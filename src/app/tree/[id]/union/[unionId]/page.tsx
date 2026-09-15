import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { addUnionChildAction, removeUnionChildAction } from '@/app/actions/union-actions'
import { loadUnion } from '@/app/tree/[id]/union/[unionId]/load-union'
import { toUnionPageViewModel } from '@/presentation/mappers/union-page-view-models'
import { PrivateTreeView } from '@/presentation/views/private-tree-view'
import { UnionPageView } from '@/presentation/views/union-page-view'

type UnionPageProps = Readonly<{ params: Promise<{ id: string; unionId: string }> }>

export async function generateMetadata({ params }: UnionPageProps): Promise<Metadata> {
  const { id, unionId } = await params
  const { result } = await loadUnion(id, unionId)
  if (!result.ok) {
    // Neither the union nor the tree of a page the visitor may not read is ever named.
    const title = result.error.kind === 'ACCESS_DENIED' ? 'Arbre privé' : 'Union introuvable'
    return { title, robots: { index: false } }
  }
  const view = toUnionPageViewModel(result.value)
  return {
    title: view.title,
    description: `${view.typeLabel} dans l’arbre ${view.tree.name}.`,
    robots: { index: result.value.tree.isPublic },
  }
}

export default async function UnionPage({ params }: UnionPageProps) {
  const { id, unionId } = await params
  const { signedIn, result } = await loadUnion(id, unionId)
  if (!result.ok) {
    if (result.error.kind === 'TREE_NOT_FOUND' || result.error.kind === 'UNION_NOT_FOUND') {
      notFound()
    }
    return <PrivateTreeView signedIn={signedIn} />
  }

  const target = { treeId: id, unionId }
  const actions = result.value.canManage
    ? {
        add: addUnionChildAction.bind(null, target),
        remove: removeUnionChildAction.bind(null, target),
      }
    : null
  return <UnionPageView union={toUnionPageViewModel(result.value)} actions={actions} />
}
