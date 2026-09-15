import 'server-only'
import { canManageUnions } from '@/core/entities/union-access'
import { err, ok, type Result } from '@/core/shared/result'
import { toMemberSummary, type MemberSummary } from '@/core/use-cases/member-views'
import {
  readableTree,
  type TreeReadError,
  type TreeReadInput,
} from '@/core/use-cases/tree-read-access'
import type { FamilyDeps } from '@/core/use-cases/union-write-access'
import { toUnionView, type UnionView } from '@/core/use-cases/union-views'

export type GetUnionInput = TreeReadInput & { readonly unionId: string }

export type GetUnionError = TreeReadError | { readonly kind: 'UNION_NOT_FOUND' }

export type UnionPage = {
  readonly tree: { readonly id: string; readonly name: string; readonly isPublic: boolean }
  readonly union: UnionView
  /** Whether the viewer may edit the union and link or unlink its children. */
  readonly canManage: boolean
  /** Members that may be offered as a child; empty for those who cannot manage the union. */
  readonly memberOptions: readonly MemberSummary[]
}

/** A union of a readable tree, with the people it links. */
export class GetUnionUseCase {
  constructor(private readonly deps: FamilyDeps) {}

  async execute(input: GetUnionInput): Promise<Result<UnionPage, GetUnionError>> {
    const access = await readableTree(this.deps.trees, input)
    if (!access.ok) return access

    const { listing, role } = access.value
    const family = await this.deps.families.loadFamily(listing.tree.id)
    const union = family.findUnion(input.unionId)
    if (!union) return err({ kind: 'UNION_NOT_FOUND' })

    const canManage = canManageUnions(role)
    const { id, name, visibility } = listing.tree
    return ok({
      tree: { id: id.value, name, isPublic: visibility === 'PUBLIC' },
      union: toUnionView(union, family),
      canManage,
      memberOptions: canManage ? family.members().map(toMemberSummary) : [],
    })
  }
}
