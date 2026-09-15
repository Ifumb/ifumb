import 'server-only'
import { unionDeletionDiff } from '@/core/entities/union-audit'
import { ok, type Result } from '@/core/shared/result'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import {
  manageableUnion,
  type FamilyDeps,
  type UnionTarget,
  type UnionWriteError,
} from '@/core/use-cases/union-write-access'

type DeleteUnionDeps = FamilyDeps & {
  readonly unitOfWork: UnitOfWork
  readonly ids: IdGenerator
  readonly clock: Clock
}

/** The owner removes a union; its children stay in the tree without that parent link. */
export class DeleteUnionUseCase {
  constructor(private readonly deps: DeleteUnionDeps) {}

  async execute(target: UnionTarget): Promise<Result<void, UnionWriteError>> {
    const found = await manageableUnion(this.deps, target)
    if (!found.ok) return found

    const { union, family } = found.value
    await this.deps.unitOfWork.runInTransaction(async ({ unions, auditLog }) => {
      await unions.delete(union.id)
      await auditLog.record({
        id: this.deps.ids.next(),
        treeId: target.treeId,
        authorId: target.viewerId,
        action: 'UNION_DELETED',
        targetType: 'UNION',
        targetId: union.id,
        diff: unionDeletionDiff(union, family),
        createdAt: this.deps.clock.now(),
      })
    })
    return ok(undefined)
  }
}
