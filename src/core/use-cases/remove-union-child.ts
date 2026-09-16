import 'server-only'
import type { UnionChild } from '@/core/entities/union'
import { childLinkDiff, nameIn } from '@/core/entities/union-audit'
import { err, ok, type Result } from '@/core/shared/result'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import {
  manageableUnion,
  type FamilyDeps,
  type UnionTarget,
  type UnionWriteError,
} from '@/core/use-cases/union-write-access'

export type RemoveUnionChildInput = UnionTarget & { readonly childId: string }

export type RemoveUnionChildError = UnionWriteError | { readonly kind: 'NOT_A_CHILD' }

type RemoveUnionChildDeps = FamilyDeps & {
  readonly unitOfWork: UnitOfWork
  readonly ids: IdGenerator
  readonly clock: Clock
}

/** The owner unlinks a child from a union; the member stays in the tree. */
export class RemoveUnionChildUseCase {
  constructor(private readonly deps: RemoveUnionChildDeps) {}

  async execute(
    input: RemoveUnionChildInput,
  ): Promise<Result<{ childName: string }, RemoveUnionChildError>> {
    const { childId, ...target } = input
    const found = await manageableUnion(this.deps, target)
    if (!found.ok) return found
    // reason: unlike create/update/delete, unlinking a child has no shape in the pending-change
    // format (module 2.6) — an editor stays refused here, never proposing.
    if (found.value.mode !== 'apply') return err({ kind: 'UNION_MANAGEMENT_FORBIDDEN' })

    const { family, union } = found.value
    const link = union.children.find((child) => child.childId.value === childId)
    if (!link) return err({ kind: 'NOT_A_CHILD' })

    // A child whose member no longer exists is still unlinked, under its id.
    const childName = nameIn(family, link.childId) ?? childId
    await this.store(target, link, childName)
    return ok({ childName })
  }

  private store(target: UnionTarget, link: UnionChild, childName: string) {
    return this.deps.unitOfWork.runInTransaction(async ({ unions, auditLog }) => {
      await unions.removeChild(target.unionId, link.childId)
      await auditLog.record({
        id: this.deps.ids.next(),
        treeId: target.treeId,
        authorId: target.viewerId,
        action: 'UNION_UPDATED',
        targetType: 'UNION',
        targetId: target.unionId,
        diff: childLinkDiff('removed', childName, link.filiation),
        createdAt: this.deps.clock.now(),
      })
    })
  }
}
