import 'server-only'
import { generationsOf } from '@/core/entities/family-generations'
import type { CrossTreeLink } from '@/core/entities/cross-tree-link'
import { err, ok, type Result } from '@/core/shared/result'
import { TreeId } from '@/core/shared/value-objects/tree-id'
import type { CrossTreeLinkReader } from '@/core/use-cases/ports/cross-tree-link-reader'
import type { FamilyReader } from '@/core/use-cases/ports/family-reader'
import type { PendingAction } from '@/core/use-cases/ports/pending-change-reader'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import { toFamilyGraph, type FamilyGraph } from '@/core/use-cases/family-graph-views'
import {
  readableTree,
  type TreeReadError,
  type TreeReadInput,
} from '@/core/use-cases/tree-read-access'

export type GetCrossTreeBranchInput = TreeReadInput & { readonly linkId: string }

export type CrossTreeBranch = { readonly link: CrossTreeLink; readonly foreignGraph: FamilyGraph }

export type CrossTreeBranchError = TreeReadError | { readonly kind: 'CROSS_TREE_LINK_NOT_FOUND' }

type GetCrossTreeBranchDeps = {
  readonly trees: TreeReader
  readonly families: FamilyReader
  readonly links: CrossTreeLinkReader
}

const NO_PENDING_CHANGES: ReadonlyMap<string, PendingAction> = new Map()

/**
 * The whole foreign tree of a `CrossTreeLink`, for merging into the local graph (module 3.3).
 * reason: access is granted by the link itself, not by `readableTree` on the foreign tree — a
 * mutually-established link is the authorization, regardless of the foreign tree's own visibility
 * or invitations (module 3.3, decision 1). Only the local tree goes through the normal gate.
 * Never carries pending-change markers, whatever the viewer's actual role on the foreign tree
 * happens to be (decision 3) — that role is not what this feature is trusting.
 */
export class GetCrossTreeBranchUseCase {
  constructor(private readonly deps: GetCrossTreeBranchDeps) {}

  async execute(input: GetCrossTreeBranchInput): Promise<Result<CrossTreeBranch, CrossTreeBranchError>> {
    const access = await readableTree(this.deps.trees, input)
    if (!access.ok) return access

    const link = await this.deps.links.findById(input.linkId)
    const foreignSide = link?.otherSide(input.treeId)
    if (!link || !foreignSide) return err({ kind: 'CROSS_TREE_LINK_NOT_FOUND' })

    const foreignTreeId = TreeId.fromString(foreignSide.treeId)
    const [foreignListing, foreignFamily] = await Promise.all([
      this.deps.trees.findById(foreignTreeId),
      this.deps.families.loadFamily(foreignTreeId),
    ])
    if (!foreignListing) return err({ kind: 'CROSS_TREE_LINK_NOT_FOUND' })

    const facts = { generations: generationsOf(foreignFamily), pending: NO_PENDING_CHANGES }
    const foreignGraph = toFamilyGraph(foreignListing.tree, foreignFamily, { kind: 'whole' }, facts)
    return ok({ link, foreignGraph })
  }
}
