import 'server-only'
import { CrossTreeConnectionRequest } from '@/core/entities/connection-request'
import type {
  ConnectionRequestReader,
  ConnectionRequestView,
} from '@/core/use-cases/ports/connection-request-reader'
import type { Prisma, PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

const REQUESTER_TREE_INCLUDE = { requesterTree: { select: { name: true } } } as const

type ConnectionRequestRow = Prisma.CrossTreeConnectionRequestGetPayload<{
  include: typeof REQUESTER_TREE_INCLUDE
}>

/** Same reasoning as `PrismaCrossTreeSuggestionReader`: member names are not real relations here. */
export class PrismaConnectionRequestReader implements ConnectionRequestReader {
  constructor(private readonly db: PrismaExecutor) {}

  async listPendingForTree(targetTreeId: string): Promise<readonly ConnectionRequestView[]> {
    const rows = await this.db.crossTreeConnectionRequest.findMany({
      where: { targetTreeId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: REQUESTER_TREE_INCLUDE,
    })
    const memberIds = rows.flatMap((row) => [row.requesterMemberId, row.targetMemberId])
    const names = await this.namesFor(memberIds)
    return rows.map((row) => toView(row, names))
  }

  async findById(id: string): Promise<CrossTreeConnectionRequest | null> {
    const row = await this.db.crossTreeConnectionRequest.findUnique({ where: { id } })
    return row ? CrossTreeConnectionRequest.create(row) : null
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

function toView(row: ConnectionRequestRow, names: ReadonlyMap<string, string>): ConnectionRequestView {
  return {
    request: CrossTreeConnectionRequest.create(row),
    requesterTreeName: row.requesterTree.name,
    requesterMemberName: names.get(row.requesterMemberId) ?? null,
    targetMemberName: names.get(row.targetMemberId) ?? null,
  }
}
