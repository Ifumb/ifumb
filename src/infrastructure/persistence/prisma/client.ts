import 'server-only'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { requireServerEnv } from '@/infrastructure/config/server-env'
import { PrismaClient } from '@/infrastructure/persistence/prisma/generated/client'

/**
 * reason: node-postgres defaults to 10 connections per process, and the database sits behind the
 * Supabase pooler it shares with the legacy API. 5 is a conservative default for a single
 * long-running process; on Vercel, each serverless instance opens its own pool, so the real ceiling
 * is `PRISMA_POOL_MAX_CONNECTIONS × concurrent instances` against the pooler's own connection limit
 * — set the env var to retune this without a redeploy (ADR 0009).
 */
const DEFAULT_POOL_MAX_CONNECTIONS = 5

function poolMaxConnections(): number {
  const configured = Number(process.env.PRISMA_POOL_MAX_CONNECTIONS)
  return Number.isInteger(configured) && configured > 0 ? configured : DEFAULT_POOL_MAX_CONNECTIONS
}

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
    max: poolMaxConnections(),
  })
  return new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}
