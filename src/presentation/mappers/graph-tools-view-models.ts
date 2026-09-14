import type { PersonReference } from '@/core/use-cases/member-views'
import type { SelectOption } from '@/presentation/components/ui/labelled-select'
import { graphHref, type GraphHref } from '@/presentation/graph/graph-view-urls'
import type { GraphViewRequest, PairView } from '@/presentation/schemas/graph-view-schema'

export type GraphTool = 'lineage' | PairView

export type GraphToolsViewModel = {
  readonly action: GraphHref
  readonly people: readonly SelectOption[]
  /** The tool whose result is shown, or that reported a problem; its section starts open. */
  readonly active: GraphTool | null
  readonly selected: { readonly member?: string; readonly first?: string; readonly second?: string }
  readonly problem: { readonly tool: GraphTool; readonly message: string } | null
}

const PROBLEM_MESSAGES = {
  lineage: 'Choisissez un membre.',
  pair: 'Choisissez deux membres.',
  same: 'Choisissez deux membres différents.',
} as const

export function toGraphToolsViewModel(
  treeId: string,
  people: readonly PersonReference[],
  request: GraphViewRequest,
): GraphToolsViewModel {
  return {
    action: graphHref(treeId),
    people: people.map((person) => ({
      value: person.id,
      label: [person.firstName, person.lastName].filter(Boolean).join(' '),
    })),
    active: activeTool(request),
    selected: selectedMembers(request),
    problem:
      request.kind === 'incomplete'
        ? { tool: request.view, message: problemMessage(request) }
        : null,
  }
}

function activeTool(request: GraphViewRequest): GraphTool | null {
  if (request.kind === 'overview') return null
  return request.kind === 'incomplete' ? request.view : request.kind
}

function selectedMembers(request: GraphViewRequest): GraphToolsViewModel['selected'] {
  if (request.kind === 'lineage') return { member: request.memberId }
  if (request.kind === 'kinship' || request.kind === 'ancestors') {
    return { first: request.firstId, second: request.secondId }
  }
  return {}
}

function problemMessage(request: Extract<GraphViewRequest, { kind: 'incomplete' }>): string {
  if (request.view === 'lineage') return PROBLEM_MESSAGES.lineage
  return request.problem === 'SAME_MEMBER' ? PROBLEM_MESSAGES.same : PROBLEM_MESSAGES.pair
}
