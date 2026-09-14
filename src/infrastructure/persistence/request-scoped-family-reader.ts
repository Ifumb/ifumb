import 'server-only'
import { cache } from 'react'
import type { Family } from '@/core/entities/family'
import { TreeId } from '@/core/shared/value-objects/tree-id'
import type { FamilyReader } from '@/core/use-cases/ports/family-reader'

/**
 * Loads a family once per server request, however many use cases read it: the graph page runs the
 * graph and a kinship or ancestors search together. Families are immutable, so sharing is safe.
 * reason: React's `cache` only memoizes while rendering a request; elsewhere (Server Actions, tests)
 * every call reaches the wrapped reader, which is the expected behaviour there.
 */
export class RequestScopedFamilyReader implements FamilyReader {
  private readonly loadOnce: (treeId: string) => Promise<Family>

  constructor(inner: FamilyReader) {
    this.loadOnce = cache((treeId: string) => inner.loadFamily(TreeId.fromString(treeId)))
  }

  loadFamily(treeId: TreeId): Promise<Family> {
    return this.loadOnce(treeId.value)
  }
}
