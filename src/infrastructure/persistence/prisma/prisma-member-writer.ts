import 'server-only'
import type { Member } from '@/core/entities/member'
import type { MemberId } from '@/core/shared/value-objects/member-id'
import type { MemberWriter } from '@/core/use-cases/ports/member-writer'
import type { Prisma, PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

export class PrismaMemberWriter implements MemberWriter {
  constructor(private readonly db: PrismaExecutor) {}

  async insert(treeId: string, member: Member): Promise<void> {
    await this.db.member.create({ data: { id: member.id.value, treeId, ...detailColumns(member) } })
  }

  async update(member: Member): Promise<void> {
    await this.db.member.update({ where: { id: member.id.value }, data: detailColumns(member) })
  }

  /**
   * reason: the database refuses to delete a member still listed as a child (UnionChild.childId is
   * ON DELETE RESTRICT), which made the legacy deletion fail with a 500. Those links go first, in
   * the same transaction; unions where the member is a parent keep the other parent (SET NULL).
   */
  async delete(memberId: MemberId): Promise<void> {
    await this.db.unionChild.deleteMany({ where: { childId: memberId.value } })
    await this.db.member.delete({ where: { id: memberId.value } })
  }
}

function detailColumns(member: Member) {
  const { details } = member
  return {
    firstName: details.firstName,
    lastName: details.lastName,
    nickname: details.nickname,
    gender: details.gender,
    birthDate: details.birthDate?.toString() ?? null,
    birthDateApprox: details.birthDateApprox,
    deathDate: details.deathDate?.toString() ?? null,
    birthPlace: details.birthPlace,
    tribe: details.tribe,
    clan: details.clan,
    ethnicity: details.ethnicity,
    originRegion: details.originRegion,
    biography: details.biography,
    certainty: details.certainty,
  } satisfies Prisma.MemberUncheckedUpdateInput
}
