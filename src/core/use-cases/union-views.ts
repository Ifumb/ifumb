import 'server-only'
import type { Family } from '@/core/entities/family'
import type { Filiation, Union, UnionType } from '@/core/entities/union'
import type { PartialDate } from '@/core/shared/value-objects/partial-date'
import { toPersonReference, type PersonReference } from '@/core/use-cases/member-views'

/** A union with the people it links, for display. */
export type UnionView = {
  readonly id: string
  readonly type: UnionType
  readonly startDate: PartialDate | null
  readonly endDate: PartialDate | null
  readonly parents: readonly PersonReference[]
  readonly children: readonly { readonly person: PersonReference; readonly filiation: Filiation }[]
}

/** The editable details of a union, people by id. */
export type UnionDetails = {
  readonly id: string
  readonly type: UnionType
  readonly parent1Id: string | null
  readonly parent2Id: string | null
  readonly startDate: PartialDate | null
  readonly endDate: PartialDate | null
}

export function toUnionView(union: Union, family: Family): UnionView {
  return {
    id: union.id,
    type: union.type,
    startDate: union.startDate,
    endDate: union.endDate,
    parents: union.parentIds.flatMap((id) => {
      const parent = family.findMember(id)
      return parent ? [toPersonReference(parent)] : []
    }),
    children: childrenOf(union, family),
  }
}

function childrenOf(union: Union, family: Family): UnionView['children'] {
  return union.children.flatMap(({ childId, filiation }) => {
    const child = family.findMember(childId)
    return child ? [{ person: toPersonReference(child), filiation }] : []
  })
}

export function toUnionDetails(union: Union): UnionDetails {
  return {
    id: union.id,
    type: union.type,
    parent1Id: union.parent1Id?.value ?? null,
    parent2Id: union.parent2Id?.value ?? null,
    startDate: union.startDate,
    endDate: union.endDate,
  }
}
