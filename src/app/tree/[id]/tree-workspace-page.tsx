import { loadWorkspaceCounters } from '@/app/tree/[id]/load-workspace-counters'
import { notFound } from 'next/navigation'
import { loadTreeOverview } from '@/app/tree/[id]/load-tree-overview'
import { loadGraphView } from '@/app/tree/[id]/graph/load-graph-view'
import { GraphViewContent } from '@/app/tree/[id]/graph/graph-view-content'
import { container } from '@/infrastructure/di/container'
import { toTreeViewModel } from '@/presentation/mappers/tree-view-models'
import { toMemberListItem } from '@/presentation/mappers/member-view-models'
import { parseGraphView } from '@/presentation/schemas/graph-view-schema'
import { parseMemberSearch } from '@/presentation/schemas/member-search-schema'
import {
  TreeWorkspaceHeader,
  TreeGraphActions,
  TreeConnections,
} from '@/presentation/views/tree-workspace-header'
import { MemberListView } from '@/presentation/views/member-list-view'
import { PrivateTreeView } from '@/presentation/views/private-tree-view'
import { Icon } from '@/presentation/components/ui/icon'

export type TreeWorkspacePageProps = Readonly<{
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}>

// reason: l’orchestration garde les contrôles d’accès avant tout rendu des données privées.
export async function TreeWorkspacePage({ params, searchParams }: TreeWorkspacePageProps) {
  const { id } = await params
  const { viewerId, signedIn, result } = await loadTreeOverview(id)
  if (!result.ok) {
    if (result.error.kind === 'TREE_NOT_FOUND') notFound()
    return <PrivateTreeView signedIn={signedIn} />
  }
  const query = await searchParams
  const request = parseGraphView(query)
  const loaded = await loadGraphView(id, request)
  if (!loaded.graph.ok) {
    if (
      loaded.graph.error.kind === 'TREE_NOT_FOUND' ||
      loaded.graph.error.kind === 'MEMBER_NOT_FOUND'
    )
      notFound()
    return <PrivateTreeView signedIn={signedIn} />
  }
  if (loaded.mode.kind !== 'none' && !loaded.mode.result.ok) notFound()
  const members = await container
    .listTreeMembers()
    .execute({ treeId: id, viewerId, query: parseMemberSearch(query) })
  if (!members.ok) return <PrivateTreeView signedIn={signedIn} />
  const tree = toTreeViewModel(result.value)
  const counters = await loadWorkspaceCounters(id, tree.settingsHref ? viewerId : undefined)
  return (
    <section className="tree-workspace" aria-labelledby="tree-title">
      <TreeWorkspaceHeader tree={tree} signedIn={signedIn} {...counters} />
      <div className="tree-body">
        <details className="tree-sidebar" open={!!query.q}>
          <summary aria-label="Voir les membres" title="Voir les membres">
            <Icon name="next" />
          </summary>
          <div className="tree-sidebar-content">
            <MemberListView
              treeHref={tree.href}
              query={parseMemberSearch(query)}
              members={members.value.map((member) => toMemberListItem(id, member))}
            />
          </div>
        </details>
        <GraphViewContent
          treeId={id}
          request={request}
          graph={loaded.graph.value}
          mode={loaded.mode}
          crossTreeLinks={loaded.crossTreeLinks}
          actions={tree.newMemberHref ? <TreeGraphActions tree={tree} /> : undefined}
          connections={<TreeConnections tree={tree} />}
        />
      </div>
    </section>
  )
}
