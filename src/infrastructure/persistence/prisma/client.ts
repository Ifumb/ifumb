import 'server-only'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'

const DATABASE_URL_VARIABLE = 'DATABASE_URL'

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
  const connectionString = process.env[DATABASE_URL_VARIABLE]
  if (!connectionString) {
    throw new Error(`${DATABASE_URL_VARIABLE} is not set: cannot open a database connection.`)
  }
  return new PrismaClient({
    adapter: new PrismaPg(connectionString),
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}
