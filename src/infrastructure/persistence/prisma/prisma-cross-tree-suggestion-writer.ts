import 'server-only'
import type { CrossTreeSuggestion } from '@/core/entities/cross-tree-suggestion'
import type { CrossTreeSuggestionWriter } from '@/core/use-cases/ports/cross-tree-suggestion-writer'
import type { Prisma, PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

export class PrismaCrossTreeSuggestionWriter implements CrossTreeSuggestionWriter {
  constructor(private readonly db: PrismaExecutor) {}

  async upsertMany(suggestions: readonly CrossTreeSuggestion[]): Promise<void> {
    for (const suggestion of suggestions) {
      await this.upsertOne(suggestion)
    }
  }

  private async upsertOne(suggestion: CrossTreeSuggestion): Promise<void> {
    await this.db.crossTreeSuggestion.upsert({
      where: {
        memberId_targetMemberId: {
          memberId: suggestion.memberId,
          targetMemberId: suggestion.targetMemberId,
        },
      },
      update: {
        treeId: suggestion.treeId,
        targetTreeId: suggestion.targetTreeId,
        confidence: suggestion.confidence,
        status: 'NEW',
      },
      create: {
        id: suggestion.id,
        treeId: suggestion.treeId,
        memberId: suggestion.memberId,
        targetTreeId: suggestion.targetTreeId,
        targetMemberId: suggestion.targetMemberId,
        confidence: suggestion.confidence,
        status: 'NEW',
      },
    })
  }

  async resolve(suggestion: CrossTreeSuggestion): Promise<void> {
    await this.db.crossTreeSuggestion.update({
      where: { id: suggestion.id },
      data: { status: suggestion.status },
    })
  }
}
