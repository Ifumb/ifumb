import 'server-only'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { requireServerEnv } from '@/infrastructure/config/server-env'
import { PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'

/**
 * reason: node-postgres defaults to 10 connections per process, and the database sits behind the
 * Supabase pooler it shares with the legacy API. 5 is a conservative starting point; recompute it
 * at cutover as (pooler connection limit / maximum concurrent instances) once the hosting is known.
 */
const POOL_MAX_CONNECTIONS = 5

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
  const pool = new Pool({
    connectionString: requireServerEnv('DATABASE_URL'),
    max: POOL_MAX_CONNECTIONS,
  })
  return new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}
