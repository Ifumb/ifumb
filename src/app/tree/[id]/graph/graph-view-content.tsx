import 'server-only'
import type { ReactNode } from 'react'
import type { GraphMode } from '@/app/tree/[id]/graph/load-graph-view'
import type { FamilyGraph } from '@/core/use-cases/family-graph-views'
import type { CrossTreeLinkView } from '@/core/use-cases/ports/cross-tree-link-reader'
import { configuredMemberPhotoSource } from '@/infrastructure/config/member-photos'
import { graphHref } from '@/presentation/graph/graph-view-urls'
import { toFamilyGraphViewModel } from '@/presentation/graph/layout-family-graph'
import { toCommonAncestorsViewModel } from '@/presentation/mappers/common-ancestors-view-models'
import { toGraphToolsViewModel } from '@/presentation/mappers/graph-tools-view-models'
import { toKinshipResultViewModel } from '@/presentation/mappers/kinship-view-models'
import { toLineageBannerViewModel } from '@/presentation/mappers/lineage-view-models'
import type { GraphViewRequest } from '@/presentation/schemas/graph-view-schema'
import { FamilyGraphView } from '@/presentation/views/family-graph-view'
import {
  CommonAncestorsResultView,
  KinshipResultView,
  LineageBannerView,
} from '@/presentation/views/graph-results-view'
import { GraphToolsView } from '@/presentation/views/graph-tools-view'

type GraphViewContentProps = Readonly<{
  treeId: string
  actions?: ReactNode
  connections?: ReactNode
  request: GraphViewRequest
  graph: FamilyGraph
  mode: GraphMode
  crossTreeLinks: readonly CrossTreeLinkView[]
}>

type ModeOutcome = { readonly view: ReactNode; readonly emphasis: readonly string[] | null }

/** Composes the graph page once everything is readable: tools, the active result, the graph. */
// reason: le JSX garde ensemble la structure sémantique, ses libellés et les états de ce composant.
export function GraphViewContent({
  treeId,
  request,
  graph,
  mode,
  crossTreeLinks,
  actions,
  connections,
}: GraphViewContentProps) {
  const outcome = modeOutcome(treeId, graph, mode)
  const graphViewModel = toFamilyGraphViewModel(
    graph,
    configuredMemberPhotoSource(),
    crossTreeLinks,
  )
  const tools = toGraphToolsViewModel(treeId, graph.people, request)
  return (
    <FamilyGraphView
      graph={{ ...graphViewModel, emphasis: outcome.emphasis }}
      tools={<GraphToolsView tools={tools} />}
      result={outcome.view}
      actions={actions}
      connections={connections}
    />
  )
}

// reason: le switch exhaustif garde visibles tous les modes du graphe et leurs résultats typés.
function modeOutcome(treeId: string, graph: FamilyGraph, mode: GraphMode): ModeOutcome {
  const quitHref = graphHref(treeId)
  if (mode.kind === 'kinship' && mode.result.ok) {
    const result = toKinshipResultViewModel(treeId, mode.result.value)
    return {
      view: <KinshipResultView result={result} quitHref={quitHref} />,
      emphasis: result.emphasis,
    }
  }
  if (mode.kind === 'ancestors' && mode.result.ok) {
    const result = toCommonAncestorsViewModel(treeId, mode.result.value)
    const view = <CommonAncestorsResultView result={result} quitHref={quitHref} />
    return { view, emphasis: result.emphasis }
  }
  if (graph.lineage) {
    return {
      view: <LineageBannerView banner={toLineageBannerViewModel(treeId, graph.lineage)} />,
      emphasis: null,
    }
  }
  return { view: null, emphasis: null }
}
