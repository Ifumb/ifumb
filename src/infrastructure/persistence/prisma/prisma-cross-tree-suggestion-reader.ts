import 'server-only'
import { CrossTreeSuggestion } from '@/core/entities/cross-tree-suggestion'
import type {
  CrossTreeSuggestionReader,
  SuggestionView,
} from '@/core/use-cases/ports/cross-tree-suggestion-reader'
import type { Prisma, PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

const TARGET_TREE_INCLUDE = { targetTree: { select: { name: true } } } as const

type SuggestionRow = Prisma.CrossTreeSuggestionGetPayload<{ include: typeof TARGET_TREE_INCLUDE }>

/**
 * reason: `memberId`/`targetMemberId` are not Prisma relations (module 3.2, legacy bug 7) — names
 * are resolved with one extra query for the whole page, never one per row.
 */
export class PrismaCrossTreeSuggestionReader implements CrossTreeSuggestionReader {
  constructor(private readonly db: PrismaExecutor) {}

  async listNewForTree(treeId: string): Promise<readonly SuggestionView[]> {
    const rows = await this.db.crossTreeSuggestion.findMany({
      where: { treeId, status: 'NEW' },
      // `asc` on a Postgres enum sorts by declaration order (HIGH, MEDIUM, LOW in the schema) —
      // highest confidence first, matching the legacy app's own ordering.
      orderBy: [{ confidence: 'asc' }, { createdAt: 'desc' }],
      include: TARGET_TREE_INCLUDE,
    })
    const memberIds = rows.flatMap((row) => [row.memberId, row.targetMemberId])
    const names = await this.namesFor(memberIds)
    return rows.map((row) => toView(row, names))
  }

  async findById(id: string): Promise<CrossTreeSuggestion | null> {
    const row = await this.db.crossTreeSuggestion.findUnique({ where: { id } })
    return row ? CrossTreeSuggestion.create(row) : null
  }

  async listAcceptedPairsForTree(treeId: string): Promise<ReadonlySet<string>> {
    const rows = await this.db.crossTreeSuggestion.findMany({
      where: { treeId, status: 'ACCEPTED' },
      select: { memberId: true, targetMemberId: true },
    })
    return new Set(rows.map((row) => `${row.memberId}:${row.targetMemberId}`))
  }

  private async namesFor(memberIds: readonly string[]): Promise<ReadonlyMap<string, string>> {
    if (memberIds.length === 0) return new Map()
    const members = await this.db.member.findMany({
      where: { id: { in: [...new Set(memberIds)] } },
      select: { id: true, firstName: true, lastName: true },
    })
    return new Map(
      members.map((member) => [member.id, [member.firstName, member.lastName].filter(Boolean).join(' ')]),
    )
  }
}

function toView(row: SuggestionRow, names: ReadonlyMap<string, string>): SuggestionView {
  return {
    suggestion: CrossTreeSuggestion.create(row),
    memberName: names.get(row.memberId) ?? null,
    targetTreeName: row.targetTree.name,
    targetMemberName: names.get(row.targetMemberId) ?? null,
  }
}
