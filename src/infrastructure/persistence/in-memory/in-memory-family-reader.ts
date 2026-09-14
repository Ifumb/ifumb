import 'server-only'
import { Family } from '@/core/entities/family'
import type { Member } from '@/core/entities/member'
import type { Union } from '@/core/entities/union'
import type { TreeId } from '@/core/shared/value-objects/tree-id'
import type { FamilyReader } from '@/core/use-cases/ports/family-reader'

type StoredFamily = { readonly members: readonly Member[]; readonly unions: readonly Union[] }

/** Test double of the family reader, substitutable for the Prisma implementation. */
export class InMemoryFamilyReader implements FamilyReader {
  private readonly familiesByTree = new Map<string, StoredFamily>()

  seed(treeId: string, family: StoredFamily): void {
    this.familiesByTree.set(treeId, family)
  }

  async loadFamily(treeId: TreeId): Promise<Family> {
    const stored = this.familiesByTree.get(treeId.value)
    return Family.of(stored?.members ?? [], stored?.unions ?? [])
  }
}
