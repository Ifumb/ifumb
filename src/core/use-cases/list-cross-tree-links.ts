import 'server-only'
import { ok, type Result } from '@/core/shared/result'
import type { CrossTreeLinkReader, CrossTreeLinkView } from '@/core/use-cases/ports/cross-tree-link-reader'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import {
  readableTree,
  type TreeReadError,
  type TreeReadInput,
} from '@/core/use-cases/tree-read-access'

type ListCrossTreeLinksDeps = { readonly trees: TreeReader; readonly links: CrossTreeLinkReader }

/** Established links of a tree, for anyone who can already read it — like the legacy app. */
export class ListCrossTreeLinksUseCase {
  constructor(private readonly deps: ListCrossTreeLinksDeps) {}

  async execute(
    input: TreeReadInput,
  ): Promise<Result<readonly CrossTreeLinkView[], TreeReadError>> {
    const access = await readableTree(this.deps.trees, input)
    if (!access.ok) return access
    return ok(await this.deps.links.listForTree(input.treeId))
  }
}
