import type { PartialDate } from '@/core/shared/value-objects/partial-date'
import type {
  ParentUnionView,
  PartnerUnionView,
  PersonReference,
} from '@/core/use-cases/member-views'
import { formatPartialDate } from '@/presentation/formatting/partial-date-format'
import { FILIATION_LABELS, UNION_TYPE_LABELS } from '@/presentation/labels/member-labels'

export type MemberHref = `/tree/${string}/member/${string}`

export type UnionHref = `/tree/${string}/union/${string}`

export type MemberLink = { readonly href: MemberHref; readonly name: string }

export type ParentUnionViewModel = {
  readonly id: string
  readonly href: UnionHref
  readonly typeLabel: string
  readonly datesLabel: string | null
  readonly parents: readonly MemberLink[]
  readonly filiationLabel: string
}

export type PartnerUnionViewModel = {
  readonly id: string
  readonly href: UnionHref
  readonly typeLabel: string
  readonly datesLabel: string | null
  readonly partner: MemberLink | null
  readonly children: readonly (MemberLink & { readonly filiationLabel: string })[]
}

export function unionHref(treeId: string, unionId: string): UnionHref {
  return `/tree/${treeId}/union/${unionId}`
}

export function memberLink(treeId: string, person: PersonReference): MemberLink {
  return {
    href: `/tree/${treeId}/member/${person.id}`,
    name: [person.firstName, person.lastName].filter(Boolean).join(' '),
  }
}

export function toParentUnionViewModel(
  treeId: string,
  union: ParentUnionView,
): ParentUnionViewModel {
  return {
    id: union.id,
    href: unionHref(treeId, union.id),
    typeLabel: UNION_TYPE_LABELS[union.type],
    datesLabel: unionDatesLabel(union.startDate, union.endDate),
    parents: union.parents.map((parent) => memberLink(treeId, parent)),
    filiationLabel: FILIATION_LABELS[union.filiation],
  }
}

export function toPartnerUnionViewModel(
  treeId: string,
  union: PartnerUnionView,
): PartnerUnionViewModel {
  return {
    id: union.id,
    href: unionHref(treeId, union.id),
    typeLabel: UNION_TYPE_LABELS[union.type],
    datesLabel: unionDatesLabel(union.startDate, union.endDate),
    partner: union.partner ? memberLink(treeId, union.partner) : null,
    children: union.children.map(({ person, filiation }) => ({
      ...memberLink(treeId, person),
      filiationLabel: FILIATION_LABELS[filiation],
    })),
  }
}

/** "1980 – 1995", "depuis 1980", "jusqu'en 1995", or null when no date is known. */
export function unionDatesLabel(start: PartialDate | null, end: PartialDate | null): string | null {
  if (start && end) return `${formatPartialDate(start)} – ${formatPartialDate(end)}`
  if (start) return `depuis ${formatPartialDate(start)}`
  if (end) return `jusqu’en ${formatPartialDate(end)}`
  return null
}
