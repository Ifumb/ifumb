import 'server-only'
import { Tree, type TreeDetailsInput } from '@/core/entities/tree'
import { treeCreationDiff } from '@/core/entities/tree-audit'
import { TreeId } from '@/core/shared/value-objects/tree-id'
import { UserId } from '@/core/shared/value-objects/user-id'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'

export type CreateTreeInput = TreeDetailsInput & { readonly ownerId: string }

type CreateTreeDeps = {
  readonly unitOfWork: UnitOfWork
  readonly ids: IdGenerator
  readonly clock: Clock
}

/**
 * A new tree owned by its creator, recorded in its history in the same transaction.
 * reason: returns the new id rather than a Result — details are validated at the boundary and
 * any signed-in user may create a tree, so there is no expected failure to report.
 */
export class CreateTreeUseCase {
  constructor(private readonly deps: CreateTreeDeps) {}

  async execute({ ownerId, ...details }: CreateTreeInput): Promise<{ treeId: string }> {
    const now = this.deps.clock.now()
    const id = TreeId.fromString(this.deps.ids.next())
    const tree = Tree.start({ id, ownerId: UserId.fromString(ownerId), now, ...details })
    await this.deps.unitOfWork.runInTransaction(async ({ trees, auditLog }) => {
      await trees.insert(tree)
      await auditLog.record({
        id: this.deps.ids.next(),
        treeId: id.value,
        authorId: ownerId,
        action: 'TREE_CREATED',
        targetType: 'TREE',
        targetId: id.value,
        diff: treeCreationDiff(tree),
        createdAt: now,
      })
    })
    return { treeId: id.value }
  }
}
