import 'server-only'
import type { CrossTreeLink } from '@/core/entities/cross-tree-link'
import type { CrossTreeLinkReader, CrossTreeLinkView } from '@/core/use-cases/ports/cross-tree-link-reader'

/** Test double of the cross-tree link reader. */
export class InMemoryCrossTreeLinkReader implements CrossTreeLinkReader {
  private readonly byTree = new Map<string, CrossTreeLinkView[]>()
  private readonly byId = new Map<string, CrossTreeLink>()

  /** Seeds what `listForTree` shows for one side of the link; call once per tree it should appear under. */
  seedView(treeId: string, view: CrossTreeLinkView): void {
    this.byTree.set(treeId, [...(this.byTree.get(treeId) ?? []), view])
    this.byId.set(view.link.id, view.link)
  }

  /** Seeds what `findById` returns, when no view (and so no `listForTree` entry) is needed. */
  seed(link: CrossTreeLink): void {
    this.byId.set(link.id, link)
  }

  async listForTree(treeId: string): Promise<readonly CrossTreeLinkView[]> {
    return this.byTree.get(treeId) ?? []
  }

  async findById(id: string): Promise<CrossTreeLink | null> {
    return this.byId.get(id) ?? null
  }
}
