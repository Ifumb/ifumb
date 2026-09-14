import 'server-only'
import { canManage } from '@/core/entities/tree'
import { err, type Result } from '@/core/shared/result'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import {
  readableTree,
  type ReadableTree,
  type TreeReadError,
  type TreeReadInput,
} from '@/core/use-cases/tree-read-access'

export type TreeManagementError = TreeReadError | { readonly kind: 'TREE_MANAGEMENT_FORBIDDEN' }

/** A tree the viewer may read and manage, as its owner. */
export async function manageableTree(
  trees: TreeReader,
  input: TreeReadInput,
): Promise<Result<ReadableTree, TreeManagementError>> {
  const access = await readableTree(trees, input)
  if (!access.ok) return access
  return canManage(access.value.role) ? access : err({ kind: 'TREE_MANAGEMENT_FORBIDDEN' })
}
