import type { UnionPage } from '@/core/use-cases/get-union'
import type { UnionView } from '@/core/use-cases/union-views'
import type { SelectOption } from '@/presentation/components/ui/labelled-select'
import { memberOption } from '@/presentation/forms/union-form'
import { FILIATION_LABELS, UNION_TYPE_LABELS } from '@/presentation/labels/member-labels'
import {
  memberLink,
  unionDatesLabel,
  unionHref,
  type MemberLink,
  type UnionHref,
} from '@/presentation/mappers/union-view-models'

export type UnionChildViewModel = MemberLink & {
  readonly id: string
  readonly filiationLabel: string
}

export type UnionManagementViewModel = {
  readonly editHref: `${UnionHref}/edit`
  readonly deleteHref: `${UnionHref}/delete`
  /** Members that may still become a child: neither a parent nor already a child. */
  readonly childOptions: readonly SelectOption[]
}

export type UnionPageViewModel = {
  readonly title: string
  readonly typeLabel: string
  readonly datesLabel: string | null
  readonly tree: { readonly name: string; readonly href: `/tree/${string}` }
  readonly parents: readonly MemberLink[]
  readonly children: readonly UnionChildViewModel[]
  /** Editing, deleting and linking children, for the owner only. */
  readonly management: UnionManagementViewModel | null
}

/** "Union de Moussa Diallo et Awa Diallo"; a union without recorded parents says so. */
export function unionTitle(parents: readonly MemberLink[]): string {
  if (parents.length === 0) return 'Union sans parent renseigné'
  return `Union de ${parents.map((parent) => parent.name).join(' et ')}`
}

export function toUnionPageViewModel(page: UnionPage): UnionPageViewModel {
  const { tree, union } = page
  const parents = union.parents.map((parent) => memberLink(tree.id, parent))
  return {
    title: unionTitle(parents),
    typeLabel: UNION_TYPE_LABELS[union.type],
    datesLabel: unionDatesLabel(union.startDate, union.endDate),
    tree: { name: tree.name, href: `/tree/${tree.id}` },
    parents,
    children: union.children.map(({ person, filiation }) => ({
      ...memberLink(tree.id, person),
      id: person.id,
      filiationLabel: FILIATION_LABELS[filiation],
    })),
    management: page.canManage ? managementOf(page, union) : null,
  }
}

function managementOf(page: UnionPage, union: UnionView): UnionManagementViewModel {
  const href = unionHref(page.tree.id, union.id)
  const linked = new Set(
    [...union.parents, ...union.children.map(({ person }) => person)].map((person) => person.id),
  )
  return {
    editHref: `${href}/edit`,
    deleteHref: `${href}/delete`,
    childOptions: page.memberOptions.filter((member) => !linked.has(member.id)).map(memberOption),
  }
}
