import 'server-only'
import type { Kinship } from '@/core/entities/kinship'
import type { KinshipResult } from '@/core/use-cases/kinship-views'
import { memberNodeId, unionNodeId } from '@/presentation/graph/family-graph-view-models'
import {
  BRANCH_LABELS,
  kinshipDegreeLabel,
  kinshipLabel,
} from '@/presentation/labels/kinship-labels'
import type { Fact } from '@/presentation/mappers/fact'
import { memberLink, type MemberLink } from '@/presentation/mappers/union-view-models'

export type KinshipResultViewModel = {
  readonly statement: string
  readonly facts: readonly Fact[]
  readonly path: readonly MemberLink[]
  /** Graph nodes to put forward: the people on the path and the unions between them. */
  readonly emphasis: readonly string[]
}

export function toKinshipResultViewModel(
  treeId: string,
  result: KinshipResult,
): KinshipResultViewModel {
  const first = memberLink(treeId, result.first).name
  const second = memberLink(treeId, result.second).name
  const { relation } = result
  if (!relation) {
    return {
      statement: `Aucun lien de parenté trouvé entre ${first} et ${second}.`,
      facts: [],
      path: [],
      emphasis: [result.first.id, result.second.id].map(memberNodeId),
    }
  }
  return {
    statement: `Pour ${first}, ${second} est : ${kinshipLabel(relation, result.second.gender)}.`,
    facts: kinshipFacts(relation),
    path: result.path.map((person) => memberLink(treeId, person)),
    emphasis: pathEmphasis(result),
  }
}

function kinshipFacts(relation: Kinship): Fact[] {
  const degree = kinshipDegreeLabel(relation)
  const branch = relation.kind === 'blood' && relation.branch
  return [
    ...(degree ? [{ term: 'Degré', detail: degree }] : []),
    ...(branch ? [{ term: 'Branche', detail: BRANCH_LABELS[branch] }] : []),
  ]
}

function pathEmphasis({ path, unionIds }: KinshipResult): string[] {
  return [...path.map((person) => memberNodeId(person.id)), ...unionIds.map(unionNodeId)]
}
