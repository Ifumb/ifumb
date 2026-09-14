import 'server-only'
import { ok, type Result } from '@/core/shared/result'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import {
  readableTree,
  type TreeReadError,
  type TreeReadInput,
} from '@/core/use-cases/tree-read-access'
import { toTreeSummary, type TreeSummary } from '@/core/use-cases/tree-summary'

export type GetTreeOverviewInput = TreeReadInput

export type GetTreeOverviewError = TreeReadError

type GetTreeOverviewDeps = {
  readonly trees: TreeReader
}

export class GetTreeOverviewUseCase {
  constructor(private readonly deps: GetTreeOverviewDeps) {}

  async execute(input: GetTreeOverviewInput): Promise<Result<TreeSummary, GetTreeOverviewError>> {
    const access = await readableTree(this.deps.trees, input)
    if (!access.ok) return access
    return ok(toTreeSummary(access.value.listing, access.value.role))
  }
}
