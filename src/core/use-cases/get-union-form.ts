import 'server-only'
import { err, ok, type Result } from '@/core/shared/result'
import { toMemberSummary, type MemberSummary } from '@/core/use-cases/member-views'
import {
  manageableFamily,
  type FamilyDeps,
  type FamilyTarget,
  type UnionWriteError,
} from '@/core/use-cases/union-write-access'
import { toUnionDetails, type UnionDetails } from '@/core/use-cases/union-views'

export type GetUnionFormInput = FamilyTarget & {
  /** Absent when the form creates a union. */
  readonly unionId?: string
}

export type UnionForm = {
  readonly tree: { readonly id: string; readonly name: string }
  /** Every member of the tree, sorted by name, to choose parents from. */
  readonly members: readonly MemberSummary[]
  readonly union: UnionDetails | null
}

/** What the owner needs to create a union or change one. */
export class GetUnionFormUseCase {
  constructor(private readonly deps: FamilyDeps) {}

  async execute(input: GetUnionFormInput): Promise<Result<UnionForm, UnionWriteError>> {
    const found = await manageableFamily(this.deps, input)
    if (!found.ok) return found

    const { tree, family } = found.value
    const union = input.unionId === undefined ? null : family.findUnion(input.unionId)
    if (input.unionId !== undefined && !union) return err({ kind: 'UNION_NOT_FOUND' })
    return ok({
      tree: { id: tree.id.value, name: tree.name },
      members: family.members().map(toMemberSummary),
      union: union ? toUnionDetails(union) : null,
    })
  }
}
