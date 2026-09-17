import 'server-only'
import { canContribute } from '@/core/entities/tree'
import { err, type Result } from '@/core/shared/result'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import {
  readableTree,
  type ReadableTree,
  type TreeReadError,
  type TreeReadInput,
} from '@/core/use-cases/tree-read-access'

export type TreeContributionError = TreeReadError | { readonly kind: 'TREE_CONTRIBUTION_FORBIDDEN' }

/** A tree the viewer may read and contribute to, as its owner or an editor (module 3.2's suggestions). */
export async function contributableTree(
  trees: TreeReader,
  input: TreeReadInput,
): Promise<Result<ReadableTree, TreeContributionError>> {
  const access = await readableTree(trees, input)
  if (!access.ok) return access
  return canContribute(access.value.role) ? access : err({ kind: 'TREE_CONTRIBUTION_FORBIDDEN' })
}
