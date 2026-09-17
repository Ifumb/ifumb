import 'server-only'
import { NextResponse } from 'next/server'
import { getPrismaClient } from '@/infrastructure/persistence/prisma/client'

/**
 * Readiness probe: the process is up **and** the database is reachable through the pooler.
 * reason: added at cutover (ADR 0009) for external uptime monitoring — Vercel itself has no
 * orchestrator polling this the way Kubernetes/ECS would, unlike the liveness probe at
 * `/api/health`, which stays deliberately independent of the database.
 */
export async function GET() {
  try {
    await getPrismaClient().$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json(
      { status: 'unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
