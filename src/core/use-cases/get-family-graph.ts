import 'server-only'
import type { Family } from '@/core/entities/family'
import { generationsOf } from '@/core/entities/family-generations'
import { lineageOf, type LineageDepth } from '@/core/entities/lineage'
import type { TreeRole } from '@/core/entities/tree'
import { err, ok, type Result } from '@/core/shared/result'
import { MemberId } from '@/core/shared/value-objects/member-id'
import type { TreeId } from '@/core/shared/value-objects/tree-id'
import {
  toFamilyGraph,
  type FamilyGraph,
  type GraphScope,
} from '@/core/use-cases/family-graph-views'
import { toPersonReference } from '@/core/use-cases/member-views'
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

export type LineageRequest = LineageDepth & { readonly memberId: string }

export type GetFamilyGraphInput = TreeReadInput & {
  /** Narrows the graph to the line of descent of one member. */
  readonly lineage?: LineageRequest
}

export type GetFamilyGraphError = TreeReadError | { readonly kind: 'MEMBER_NOT_FOUND' }

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

  async execute(input: GetFamilyGraphInput): Promise<Result<FamilyGraph, GetFamilyGraphError>> {
    const access = await readableTree(this.deps.trees, input)
    if (!access.ok) return access

    const { listing, role } = access.value
    const [family, pending] = await Promise.all([
      this.deps.families.loadFamily(listing.tree.id),
      this.pendingChangesFor(listing.tree.id, role),
    ])
    const scope = graphScope(family, input.lineage)
    if (!scope.ok) return scope
    const facts = { generations: generationsOf(family), pending }
    return ok(toFamilyGraph(listing.tree, family, scope.value, facts))
  }

  private async pendingChangesFor(treeId: TreeId, role: TreeRole) {
    if (!canSeePendingChanges(role)) return NO_PENDING_CHANGES
    return this.deps.pendingChanges.pendingTargets(treeId)
  }
}

function graphScope(
  family: Family,
  request: LineageRequest | undefined,
): Result<GraphScope, { readonly kind: 'MEMBER_NOT_FOUND' }> {
  if (!request) return ok({ kind: 'whole' })
  const pivotId = MemberId.fromString(request.memberId)
  const pivot = family.findMember(pivotId)
  if (!pivot) return err({ kind: 'MEMBER_NOT_FOUND' })

  const { ancestors, descendants } = request
  const lineage = lineageOf(family, pivotId, { ancestors, descendants })
  const { hasDescendants, deepestDescendantShown } = lineage
  const pivotView = { pivot: toPersonReference(pivot), ancestors, descendants }
  return ok({
    kind: 'lineage',
    lineage,
    view: { ...pivotView, hasDescendants, deepestDescendantShown },
  })
}
