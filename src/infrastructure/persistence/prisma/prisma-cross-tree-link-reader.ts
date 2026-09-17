import 'server-only'
import { CrossTreeLink } from '@/core/entities/cross-tree-link'
import type { CrossTreeLinkReader, CrossTreeLinkView } from '@/core/use-cases/ports/cross-tree-link-reader'
import type { Prisma, PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

const TREES_INCLUDE = {
  tree1: { select: { name: true } },
  tree2: { select: { name: true } },
} as const

type LinkRow = Prisma.CrossTreeLinkGetPayload<{ include: typeof TREES_INCLUDE }>

export class PrismaCrossTreeLinkReader implements CrossTreeLinkReader {
  constructor(private readonly db: PrismaExecutor) {}

  async listForTree(treeId: string): Promise<readonly CrossTreeLinkView[]> {
    const rows = await this.db.crossTreeLink.findMany({
      where: { OR: [{ tree1Id: treeId }, { tree2Id: treeId }] },
      orderBy: { createdAt: 'desc' },
      include: TREES_INCLUDE,
    })
    const memberIds = rows.flatMap((row) => [row.member1Id, row.member2Id])
    const names = await this.namesFor(memberIds)
    return rows.map((row) => toView(row, treeId, names))
  }

  async findById(id: string): Promise<CrossTreeLink | null> {
    const row = await this.db.crossTreeLink.findUnique({ where: { id } })
    return row ? CrossTreeLink.create(row) : null
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

function toView(row: LinkRow, treeId: string, names: ReadonlyMap<string, string>): CrossTreeLinkView {
  const link = CrossTreeLink.create(row)
  const own = link.ownSide(treeId)
  const other = link.otherSide(treeId)
  const linkedTreeName = row.tree1Id === treeId ? row.tree2.name : row.tree1.name
  return {
    link,
    linkedTreeName,
    linkedMemberName: other ? (names.get(other.memberId) ?? null) : null,
    ownMemberName: own ? (names.get(own.memberId) ?? null) : null,
  }
}
