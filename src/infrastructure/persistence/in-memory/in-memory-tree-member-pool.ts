import 'server-only'
import type { MatchableMember } from '@/core/entities/member-matching'
import type { TreeMemberPool } from '@/core/use-cases/ports/tree-member-pool'

/** Test double of the cross-tree candidate pool: whatever is seeded, filtered only by source tree. */
export class InMemoryTreeMemberPool implements TreeMemberPool {
  private readonly candidates: MatchableMember[] = []

  seed(candidate: MatchableMember): void {
    this.candidates.push(candidate)
  }

  async candidatesFor(sourceTreeId: string): Promise<readonly MatchableMember[]> {
    return this.candidates.filter((candidate) => candidate.treeId !== sourceTreeId)
  }
}
