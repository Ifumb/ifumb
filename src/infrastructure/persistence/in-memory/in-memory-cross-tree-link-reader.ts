import 'server-only'
import type { CrossTreeLinkReader, CrossTreeLinkView } from '@/core/use-cases/ports/cross-tree-link-reader'

/** Test double of the cross-tree link reader. */
export class InMemoryCrossTreeLinkReader implements CrossTreeLinkReader {
  private readonly byTree = new Map<string, CrossTreeLinkView[]>()

  /** Seeds what `listForTree` shows for one side of the link; call once per tree it should appear under. */
  seedView(treeId: string, view: CrossTreeLinkView): void {
    this.byTree.set(treeId, [...(this.byTree.get(treeId) ?? []), view])
  }

  async listForTree(treeId: string): Promise<readonly CrossTreeLinkView[]> {
    return this.byTree.get(treeId) ?? []
  }
}
