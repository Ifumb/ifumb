import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadTreeOverview } from '@/app/tree/[id]/load-tree-overview'
import type { GetTreeOverviewError } from '@/core/use-cases/get-tree-overview'
import { container } from '@/infrastructure/di/container'
import { toMemberListItem } from '@/presentation/mappers/member-view-models'
import { toTreeViewModel } from '@/presentation/mappers/tree-view-models'
import { parseMemberSearch } from '@/presentation/schemas/member-search-schema'
import { MemberListView } from '@/presentation/views/member-list-view'
import { PrivateTreeView } from '@/presentation/views/private-tree-view'
import { TreeOverviewView } from '@/presentation/views/tree-overview-view'

type TreePageProps = Readonly<{
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}>

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

export default async function TreePage({ params, searchParams }: TreePageProps) {
  const { id } = await params
  const { viewerId, signedIn, result } = await loadTreeOverview(id)
  if (!result.ok) return unreadableTree(result.error)

  const query = parseMemberSearch(await searchParams)
  const tree = toTreeViewModel(result.value)
  return (
    <div className="space-y-10">
      <TreeOverviewView tree={tree} backLink={backLinkFor(signedIn)} />
      <MemberListView
        treeHref={tree.href}
        members={await loadMemberList({ treeId: id, viewerId, query })}
        query={query}
      />
    </div>
  )
}

function unreadableTree(error: GetTreeOverviewError) {
  if (error.kind === 'TREE_NOT_FOUND') notFound()
  return <PrivateTreeView signedIn={error.kind === 'ACCESS_DENIED'} />
}

type MemberListRequest = {
  readonly treeId: string
  readonly viewerId?: string
  readonly query?: string
}

async function loadMemberList(request: MemberListRequest) {
  const members = await container.listTreeMembers().execute(request)
  // reason: access was granted a moment earlier in the same request; losing it now is not an
  // expected outcome to render, so it goes to the error boundary.
  if (!members.ok) throw new Error(`Tree ${request.treeId} became unreadable while rendering.`)
  return members.value.map((member) => toMemberListItem(request.treeId, member))
}

function backLinkFor(signedIn: boolean) {
  return signedIn
    ? ({ href: '/dashboard', label: 'Mes arbres' } as const)
    : ({ href: '/', label: 'Accueil' } as const)
}
