import 'server-only'
import { PrismaPg } from '@prisma/adapter-pg'
import { requireServerEnv } from '@/infrastructure/config/server-env'
import { PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

/**
 * Returns the process-wide PrismaClient, created on first use.
 * Resolving the connection lazily lets `next build` run without database secrets.
 */
export function getPrismaClient(): PrismaClient {
  globalForPrisma.prisma ??= createPrismaClient()
  return globalForPrisma.prisma
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg(requireServerEnv('DATABASE_URL')),
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}
