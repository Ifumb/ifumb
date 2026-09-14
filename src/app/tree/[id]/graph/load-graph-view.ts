import 'server-only'
import type { Result } from '@/core/shared/result'
import type { GetFamilyGraphInput } from '@/core/use-cases/get-family-graph'
import type { CommonAncestorsResult, KinshipResult } from '@/core/use-cases/kinship-views'
import type { MemberPairError } from '@/core/use-cases/member-pair-access'
import type { TreeReadInput } from '@/core/use-cases/tree-read-access'
import { currentUserOrNull } from '@/infrastructure/auth/current-user'
import { container } from '@/infrastructure/di/container'
import type { GraphViewRequest } from '@/presentation/schemas/graph-view-schema'

export type GraphMode =
  | { readonly kind: 'none' }
  | { readonly kind: 'kinship'; readonly result: Result<KinshipResult, MemberPairError> }
  | { readonly kind: 'ancestors'; readonly result: Result<CommonAncestorsResult, MemberPairError> }

/** Reads the graph and, when a tool is active, its result, for the current visitor. */
export async function loadGraphView(treeId: string, request: GraphViewRequest) {
  const viewer = await currentUserOrNull()
  const reader: TreeReadInput = { treeId, viewerId: viewer?.id }
  const [graph, mode] = await Promise.all([
    container.getFamilyGraph().execute(graphInput(reader, request)),
    loadMode(reader, request),
  ])
  return { signedIn: viewer !== null, graph, mode }
}

function graphInput(reader: TreeReadInput, request: GraphViewRequest): GetFamilyGraphInput {
  if (request.kind !== 'lineage') return reader
  const { memberId, ancestors, descendants } = request
  return { ...reader, lineage: { memberId, ancestors, descendants } }
}

async function loadMode(reader: TreeReadInput, request: GraphViewRequest): Promise<GraphMode> {
  if (request.kind === 'kinship') {
    const result = await container.findKinship().execute({ ...reader, ...pairOf(request) })
    return { kind: 'kinship', result }
  }
  if (request.kind === 'ancestors') {
    const result = await container.findCommonAncestors().execute({ ...reader, ...pairOf(request) })
    return { kind: 'ancestors', result }
  }
  return { kind: 'none' }
}

function pairOf({ firstId, secondId }: { firstId: string; secondId: string }) {
  return { firstId, secondId }
}
