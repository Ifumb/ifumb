import type { Gender } from '@/core/entities/member'
import type {
  GraphEdge,
  MemberNodeData,
  PositionedNode,
} from '@/presentation/graph/family-graph-types'
import { isMemberNode } from '@/presentation/graph/family-graph-types'

export type GraphFilters = {
  readonly tribe: string
  readonly ethnicity: string
  readonly gender: Gender | ''
  /** The generation index as text, or '' for every generation. */
  readonly generation: string
}

export type FilterOptions = {
  readonly tribes: readonly string[]
  readonly ethnicities: readonly string[]
  readonly generations: readonly number[]
}

export const GENDERS: readonly Gender[] = ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN']

export const NO_FILTERS: GraphFilters = { tribe: '', ethnicity: '', gender: '', generation: '' }

const collator = new Intl.Collator('fr', { sensitivity: 'base' })

export function activeFilterCount(filters: GraphFilters): number {
  return Object.values(filters).filter((value) => value !== '').length
}

/** The filters with one of them set from a form value; an unknown gender clears that filter. */
export function withFilter(
  filters: GraphFilters,
  key: keyof GraphFilters,
  value: string,
): GraphFilters {
  if (key === 'gender') return { ...filters, gender: GENDERS.find((g) => g === value) ?? '' }
  return { ...filters, [key]: value }
}

export function filterOptions(nodes: readonly PositionedNode[]): FilterOptions {
  const members = nodes.filter(isMemberNode).map((node) => node.data)
  return {
    tribes: distinctSorted(members.flatMap((member) => member.tribes)),
    ethnicities: distinctSorted(members.flatMap((member) => member.ethnicities)),
    generations: [...new Set(members.map((member) => member.generation))].sort((a, b) => a - b),
  }
}

export function matchesFilters(member: MemberNodeData, filters: GraphFilters): boolean {
  return (
    (filters.tribe === '' || member.tribes.includes(filters.tribe)) &&
    (filters.ethnicity === '' || member.ethnicities.includes(filters.ethnicity)) &&
    (filters.gender === '' || member.gender === filters.gender) &&
    (filters.generation === '' || member.generation === Number(filters.generation))
  )
}

/** Matching members, plus the unions still linked to at least one of them. */
export function visibleNodeIds(
  nodes: readonly PositionedNode[],
  edges: readonly GraphEdge[],
  filters: GraphFilters,
): ReadonlySet<string> {
  const members = nodes.filter(isMemberNode)
  const visibleMembers = new Set(
    members.filter((node) => matchesFilters(node.data, filters)).map((node) => node.id),
  )
  const linkedUnions = edges.flatMap((edge) => {
    if (visibleMembers.has(edge.source)) return [edge.target]
    return visibleMembers.has(edge.target) ? [edge.source] : []
  })
  return new Set([...visibleMembers, ...linkedUnions])
}

function distinctSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort(collator.compare)
}
