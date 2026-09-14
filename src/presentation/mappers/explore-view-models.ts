import type { PublicMemberSearch } from '@/core/use-cases/search-public-members'
import type { PublicTreeExploration } from '@/core/use-cases/explore-public-trees'
import type { PublicMemberSummary, PublicTreeSummary } from '@/core/use-cases/explore-views'
import type { SelectOption } from '@/presentation/components/ui/labelled-select'
import { exploreMembersHref, exploreTreesHref } from '@/presentation/explore/explore-urls'
import { memberCountLabel } from '@/presentation/labels/tree-labels'
import {
  toPaginationViewModel,
  type PaginationViewModel,
} from '@/presentation/mappers/pagination-view-models'
import { memberLink, type MemberLink } from '@/presentation/mappers/union-view-models'
import type { PublicTreeSearch } from '@/presentation/schemas/explore-schema'

const MAX_TREE_TAGS = 4

export type PublicTreeCardViewModel = {
  readonly id: string
  readonly href: `/tree/${string}`
  readonly name: string
  readonly byline: string
  readonly description: string | null
  readonly tags: readonly string[]
}

export type TreeExplorationViewModel = {
  readonly filters: { readonly text?: string; readonly tribe?: string; readonly ethnicity?: string }
  readonly tribeOptions: readonly SelectOption[]
  readonly ethnicityOptions: readonly SelectOption[]
  readonly hasCriteria: boolean
  readonly status: string
  readonly trees: readonly PublicTreeCardViewModel[]
  readonly pagination: PaginationViewModel | null
}

export type PublicMemberRowViewModel = MemberLink & {
  readonly details: string | null
  readonly tree: { readonly name: string; readonly href: `/tree/${string}` }
}

export type MemberSearchViewModel = {
  readonly query?: string
  readonly status: string
  readonly members: readonly PublicMemberRowViewModel[]
  readonly pagination: PaginationViewModel | null
}

export function toTreeExplorationViewModel(
  exploration: PublicTreeExploration,
): TreeExplorationViewModel {
  const { criteria, trees, facets } = exploration
  const hasCriteria = Boolean(criteria.text || criteria.tribe || criteria.ethnicity)
  const search = (page: number): PublicTreeSearch => ({ ...criteria, page })
  return {
    filters: criteria,
    tribeOptions: facets.tribes.map(asOption),
    ethnicityOptions: facets.ethnicities.map(asOption),
    hasCriteria,
    status: treeStatus(trees.total, hasCriteria),
    trees: trees.items.map(toPublicTreeCard),
    pagination: toPaginationViewModel(trees, (page) => exploreTreesHref(search(page))),
  }
}

function treeStatus(total: number, hasCriteria: boolean): string {
  if (total > 0) return `${total} arbre${total > 1 ? 's' : ''} trouvé${total > 1 ? 's' : ''}.`
  return hasCriteria
    ? 'Aucun arbre ne correspond à ces critères.'
    : 'Aucun arbre public disponible pour l’instant.'
}

function toPublicTreeCard(tree: PublicTreeSummary): PublicTreeCardViewModel {
  const owner = [tree.owner.firstName, tree.owner.lastName].filter(Boolean).join(' ')
  return {
    id: tree.id,
    href: `/tree/${tree.id}`,
    name: tree.name,
    byline: `par ${owner} · ${memberCountLabel(tree.memberCount)}`,
    description: tree.description,
    tags: [...tree.ethnicities, ...tree.tribes].slice(0, MAX_TREE_TAGS),
  }
}

export function toMemberSearchViewModel(search: PublicMemberSearch): MemberSearchViewModel {
  const query = search.query ?? undefined
  const { members } = search
  return {
    query,
    status: memberStatus(members.total, query),
    members: members.items.map(toPublicMemberRow),
    pagination: toPaginationViewModel(members, (page) => exploreMembersHref({ query, page })),
  }
}

function memberStatus(total: number, query: string | undefined): string {
  if (!query) return 'Saisissez un nom, une tribu ou une région pour commencer.'
  if (total === 0) return `Aucun membre trouvé pour « ${query} ».`
  return `${total} membre${total > 1 ? 's' : ''} trouvé${total > 1 ? 's' : ''} pour « ${query} ».`
}

function toPublicMemberRow(member: PublicMemberSummary): PublicMemberRowViewModel {
  const born = member.birthDate ? `Né(e) en ${member.birthDate.year}` : null
  const { birthPlace, tribes, ethnicities, clan, originRegion } = member
  const details = [born, birthPlace, ...tribes, ...ethnicities, clan, originRegion]
  return {
    ...memberLink(member.tree.id, member),
    details: details.filter(Boolean).join(' · ') || null,
    tree: { name: member.tree.name, href: `/tree/${member.tree.id}` },
  }
}

function asOption(value: string): SelectOption {
  return { value, label: value }
}
