import 'server-only'
import { generationsOf } from '@/core/entities/family-generations'
import type { TreeRole } from '@/core/entities/tree'
import { ok, type Result } from '@/core/shared/result'
import type { TreeId } from '@/core/shared/value-objects/tree-id'
import {
  toGraphMember,
  toGraphUnion,
  type FamilyGraph,
  type GraphContext,
} from '@/core/use-cases/family-graph-views'
import type { FamilyReader } from '@/core/use-cases/ports/family-reader'
import type {
  PendingAction,
  PendingChangeReader,
} from '@/core/use-cases/ports/pending-change-reader'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import {
  readableTree,
  type TreeReadError,
  type TreeReadInput,
} from '@/core/use-cases/tree-read-access'

export type GetFamilyGraphError = TreeReadError

type GetFamilyGraphDeps = {
  readonly trees: TreeReader
  readonly families: FamilyReader
  readonly pendingChanges: PendingChangeReader
}

const NO_PENDING_CHANGES: ReadonlyMap<string, PendingAction> = new Map()

/** Only those who may propose changes learn which members and unions have one waiting. */
export function canSeePendingChanges(role: TreeRole): boolean {
  return role === 'OWNER' || role === 'EDITOR'
}

export class GetFamilyGraphUseCase {
  constructor(private readonly deps: GetFamilyGraphDeps) {}

  async execute(input: TreeReadInput): Promise<Result<FamilyGraph, GetFamilyGraphError>> {
    const access = await readableTree(this.deps.trees, input)
    if (!access.ok) return access

    const { listing, role } = access.value
    const [family, pending] = await Promise.all([
      this.deps.families.loadFamily(listing.tree.id),
      this.pendingChangesFor(listing.tree.id, role),
    ])
    const context: GraphContext = { generations: generationsOf(family), pending }
    return ok({
      tree: { id: listing.tree.id.value, name: listing.tree.name },
      members: family.members().map((member) => toGraphMember(member, context)),
      unions: family.unions().map((union) => toGraphUnion(union, family, context)),
    })
  }

  private async pendingChangesFor(treeId: TreeId, role: TreeRole) {
    if (!canSeePendingChanges(role)) return NO_PENDING_CHANGES
    return this.deps.pendingChanges.pendingTargets(treeId)
  }
}
