import 'server-only'
import type { CrossTreeLink } from '@/core/entities/cross-tree-link'

export type CrossTreeLinkView = {
  readonly link: CrossTreeLink
  readonly linkedTreeName: string
  readonly linkedMemberName: string | null
  readonly ownMemberName: string | null
}

/** Read side of established cross-tree links, seen from one of the two trees they connect. */
export interface CrossTreeLinkReader {
  listForTree(treeId: string): Promise<readonly CrossTreeLinkView[]>
  findById(id: string): Promise<CrossTreeLink | null>
}
