import 'server-only'
import { ContactRequest, type ContactRequestStatus } from '@/core/entities/contact-request'
import { culturalTokens } from '@/core/entities/cultural-tokens'
import type {
  ContactRequestMember,
  ContactRequestReader,
  ReceivedContactRequestView,
  SentContactRequestView,
} from '@/core/use-cases/ports/contact-request-reader'
import type { PersonName } from '@/core/use-cases/ports/tree-reader'
import type { Prisma, PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import { optionalPartialDate } from '@/infrastructure/persistence/prisma/mappers/family-mapper'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

const MEMBER_SELECT = {
  firstName: true,
  lastName: true,
  birthDate: true,
  ethnicity: true,
  originRegion: true,
} as const satisfies Prisma.MemberSelect

const RECEIVED_INCLUDE = {
  requester: { select: { firstName: true, lastName: true, email: true } },
  member: { select: MEMBER_SELECT },
} as const

const SENT_INCLUDE = {
  member: { select: MEMBER_SELECT },
  tree: {
    select: { name: true, owner: { select: { firstName: true, lastName: true, email: true } } },
  },
} as const

type ReceivedRow = Prisma.ContactRequestGetPayload<{ include: typeof RECEIVED_INCLUDE }>
type SentRow = Prisma.ContactRequestGetPayload<{ include: typeof SENT_INCLUDE }>
type MemberRow = Prisma.MemberGetPayload<{ select: typeof MEMBER_SELECT }>

export class PrismaContactRequestReader implements ContactRequestReader {
  constructor(private readonly db: PrismaExecutor) {}

  async findById(id: string): Promise<ContactRequest | null> {
    const row = await this.db.contactRequest.findUnique({ where: { id } })
    return row ? ContactRequest.create(row) : null
  }

  async findByRequesterAndMember(requesterId: string, memberId: string): Promise<ContactRequest | null> {
    const row = await this.db.contactRequest.findUnique({
      where: { requesterId_memberId: { requesterId, memberId } },
    })
    return row ? ContactRequest.create(row) : null
  }

  async listReceivedBy(userId: string): Promise<readonly ReceivedContactRequestView[]> {
    const rows = await this.db.contactRequest.findMany({
      where: { tree: { ownerId: userId } },
      orderBy: { createdAt: 'desc' },
      include: RECEIVED_INCLUDE,
    })
    return rows.map(toReceivedView)
  }

  async listSentBy(userId: string): Promise<readonly SentContactRequestView[]> {
    const rows = await this.db.contactRequest.findMany({
      where: { requesterId: userId },
      orderBy: { createdAt: 'desc' },
      include: SENT_INCLUDE,
    })
    return rows.map(toSentView)
  }

  async findStatusesForRequester(
    requesterId: string,
    memberIds: readonly string[],
  ): Promise<ReadonlyMap<string, ContactRequestStatus>> {
    if (memberIds.length === 0) return new Map()
    const rows = await this.db.contactRequest.findMany({
      where: { requesterId, memberId: { in: [...memberIds] } },
      select: { memberId: true, status: true },
    })
    return new Map(rows.map((row) => [row.memberId, row.status]))
  }
}

function toReceivedView(row: ReceivedRow): ReceivedContactRequestView {
  return {
    contactRequest: ContactRequest.create(row),
    requesterName: toPersonName(row.requester),
    requesterEmail: row.status === 'ACCEPTED' ? row.requester.email : null,
    member: toMember(row.member),
  }
}

function toSentView(row: SentRow): SentContactRequestView {
  return {
    contactRequest: ContactRequest.create(row),
    treeName: row.tree.name,
    ownerName: toPersonName(row.tree.owner),
    ownerEmail: row.status === 'ACCEPTED' ? row.tree.owner.email : null,
    member: toMember(row.member),
  }
}

function toPersonName(person: { firstName: string; lastName: string }): PersonName {
  return { firstName: person.firstName, lastName: person.lastName }
}

function toMember(row: MemberRow): ContactRequestMember {
  return {
    firstName: row.firstName,
    lastName: row.lastName,
    birthDate: optionalPartialDate(row.birthDate),
    ethnicities: culturalTokens(row.ethnicity),
    originRegion: row.originRegion,
  }
}
