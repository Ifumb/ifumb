import 'server-only'
import type { Tree, TreeDetailChange, TreeDetailsInput } from '@/core/entities/tree'
import { treeRevisionDiff } from '@/core/entities/tree-audit'
import { ok, type Result } from '@/core/shared/result'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import { manageableTree, type TreeManagementError } from '@/core/use-cases/tree-management-access'

export type UpdateTreeInput = TreeDetailsInput & {
  readonly treeId: string
  readonly viewerId: string
}

export type UpdateTreeError = TreeManagementError

type UpdateTreeDeps = {
  readonly trees: TreeReader
  readonly unitOfWork: UnitOfWork
  readonly ids: IdGenerator
  readonly clock: Clock
}

/** The owner revises a tree; only real changes are stored, with their history entry. */
export class UpdateTreeUseCase {
  constructor(private readonly deps: UpdateTreeDeps) {}

  async execute(input: UpdateTreeInput): Promise<Result<{ changed: boolean }, UpdateTreeError>> {
    const { treeId, viewerId, ...details } = input
    const access = await manageableTree(this.deps.trees, { treeId, viewerId })
    if (!access.ok) return access

    const now = this.deps.clock.now()
    const { tree, changes } = access.value.listing.tree.revise(details, now)
    if (changes.length === 0) return ok({ changed: false })
    await this.store(tree, changes, { authorId: viewerId, now })
    return ok({ changed: true })
  }

  private store(tree: Tree, changes: TreeDetailChange[], by: { authorId: string; now: Date }) {
    return this.deps.unitOfWork.runInTransaction(async ({ trees, auditLog }) => {
      await trees.update(tree)
      await auditLog.record({
        id: this.deps.ids.next(),
        treeId: tree.id.value,
        authorId: by.authorId,
        action: 'TREE_UPDATED',
        targetType: 'TREE',
        targetId: tree.id.value,
        diff: treeRevisionDiff(changes),
        createdAt: by.now,
      })
    })
  }
}
