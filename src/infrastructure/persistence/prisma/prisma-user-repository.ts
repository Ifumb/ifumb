import 'server-only'
import type { User } from '@/core/entities/user'
import type { Email } from '@/core/shared/value-objects/email'
import type { UserId } from '@/core/shared/value-objects/user-id'
import type { UserRepository } from '@/core/use-cases/ports/user-repository'
import type { Prisma, PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'
import {
  toDomainUser,
  toUserWriteData,
} from '@/infrastructure/persistence/prisma/mappers/user-mapper'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly db: PrismaExecutor) {}

  async findById(id: UserId): Promise<User | null> {
    const row = await this.db.user.findUnique({ where: { id: id.value } })
    return row ? toDomainUser(row) : null
  }

  async findByEmail(email: Email): Promise<User | null> {
    const row = await this.db.user.findUnique({ where: { email: email.value } })
    return row ? toDomainUser(row) : null
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    const row = await this.db.user.findUnique({ where: { resetToken: token } })
    return row ? toDomainUser(row) : null
  }

  async save(user: User): Promise<void> {
    const { id, createdAt, ...changes } = toUserWriteData(user)
    await this.db.user.upsert({
      where: { id },
      create: { id, createdAt, ...changes },
      update: changes,
    })
  }
}
