import 'server-only'
import type { CommonAncestorView, CommonAncestorsResult } from '@/core/use-cases/kinship-views'
import { memberNodeId } from '@/presentation/graph/family-graph-view-models'
import { memberLink, type MemberLink } from '@/presentation/mappers/union-view-models'

export type CommonAncestorItem = MemberLink & { readonly distances: string }

export type CommonAncestorsViewModel = {
  readonly statement: string
  readonly ancestors: readonly CommonAncestorItem[]
  /** Graph nodes to put forward: the two members and their common ancestors. */
  readonly emphasis: readonly string[]
}

export function toCommonAncestorsViewModel(
  treeId: string,
  result: CommonAncestorsResult,
): CommonAncestorsViewModel {
  const names = [memberLink(treeId, result.first).name, memberLink(treeId, result.second).name]
  const people = [result.first, result.second, ...result.ancestors.map((a) => a.person)]
  return {
    statement: statementFor(result.ancestors.length, names),
    ancestors: result.ancestors.map((ancestor) => toAncestorItem(treeId, ancestor, names)),
    emphasis: people.map((person) => memberNodeId(person.id)),
  }
}

function statementFor(count: number, [first, second]: readonly string[]): string {
  if (count === 0) return `Aucun ancêtre commun trouvé entre ${first} et ${second}.`
  const plural = count > 1 ? 's' : ''
  return `${count} ancêtre${plural} commun${plural} à ${first} et ${second}.`
}

function toAncestorItem(
  treeId: string,
  ancestor: CommonAncestorView,
  [first, second]: readonly string[],
): CommonAncestorItem {
  const fromFirst = `${generations(ancestor.distanceFromFirst)} depuis ${first}`
  const fromSecond = `${generations(ancestor.distanceFromSecond)} depuis ${second}`
  return { ...memberLink(treeId, ancestor.person), distances: `${fromFirst} · ${fromSecond}` }
}

function generations(count: number): string {
  return `${count} génération${count > 1 ? 's' : ''}`
}
