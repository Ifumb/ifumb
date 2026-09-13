import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadTreeOverview } from '@/app/tree/[id]/load-tree-overview'
import { toTreeViewModel } from '@/presentation/mappers/tree-view-models'
import { PrivateTreeView } from '@/presentation/views/private-tree-view'
import { TreeOverviewView } from '@/presentation/views/tree-overview-view'

type TreePageProps = Readonly<{ params: Promise<{ id: string }> }>

const DEFAULT_DESCRIPTION = 'Un arbre généalogique partagé sur IFUMB.'

export async function generateMetadata({ params }: TreePageProps): Promise<Metadata> {
  const { result } = await loadTreeOverview((await params).id)
  if (!result.ok) {
    // A tree the visitor may not read never gives its name away, not even in the tab title.
    const title = result.error.kind === 'TREE_NOT_FOUND' ? 'Arbre introuvable' : 'Arbre privé'
    return { title, robots: { index: false } }
  }
  const tree = result.value
  return {
    title: tree.name,
    description: tree.description ?? DEFAULT_DESCRIPTION,
    robots: { index: tree.visibility === 'PUBLIC' },
  }
}

export default async function TreePage({ params }: TreePageProps) {
  const { signedIn, result } = await loadTreeOverview((await params).id)

  if (result.ok) {
    const backLink = signedIn
      ? ({ href: '/dashboard', label: 'Mes arbres' } as const)
      : ({ href: '/', label: 'Accueil' } as const)
    return <TreeOverviewView tree={toTreeViewModel(result.value)} backLink={backLink} />
  }
  if (result.error.kind === 'TREE_NOT_FOUND') notFound()
  return <PrivateTreeView signedIn={result.error.kind === 'ACCESS_DENIED'} />
}
