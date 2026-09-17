import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadTreeOverview } from '@/app/tree/[id]/load-tree-overview'
import { loadCrossTreeLinks } from '@/app/tree/[id]/links/load-cross-tree-links'
import type { GetTreeOverviewError } from '@/core/use-cases/get-tree-overview'
import { toCrossTreeLinkItems } from '@/presentation/mappers/cross-tree-link-view-models'
import { CrossTreeLinksView } from '@/presentation/views/cross-tree-links-view'
import { PrivateTreeView } from '@/presentation/views/private-tree-view'

type LinksPageProps = Readonly<{ params: Promise<{ id: string }> }>

export async function generateMetadata({ params }: LinksPageProps): Promise<Metadata> {
  const { result } = await loadTreeOverview((await params).id)
  if (!result.ok) {
    const title = result.error.kind === 'TREE_NOT_FOUND' ? 'Arbre introuvable' : 'Arbre privé'
    return { title, robots: { index: false } }
  }
  return { title: `Liaisons inter-arbres — ${result.value.name}`, robots: { index: false } }
}

export default async function LinksPage({ params }: LinksPageProps) {
  const { id } = await params
  const overview = await loadTreeOverview(id)
  if (!overview.result.ok) return unreadableTree(overview.result.error, overview.signedIn)

  const { result } = await loadCrossTreeLinks(id)
  // reason: access was granted a moment earlier by `loadTreeOverview`, and `ListCrossTreeLinksUseCase`
  // checks the very same access — losing it in between is not an expected outcome to render.
  if (!result.ok) throw new Error(`Tree ${id} became unreadable while rendering its links.`)

  return (
    <CrossTreeLinksView
      treeName={overview.result.value.name}
      treeHref={`/tree/${id}`}
      items={toCrossTreeLinkItems(id, result.value)}
    />
  )
}

function unreadableTree(error: GetTreeOverviewError, signedIn: boolean) {
  if (error.kind === 'TREE_NOT_FOUND') notFound()
  return <PrivateTreeView signedIn={signedIn} />
}
