import 'server-only'
import { NextResponse } from 'next/server'

/**
 * Liveness probe: the process is up and serving requests.
 * reason: deliberately independent of the database — a slow or cold pooler must not make an
 * orchestrator restart a healthy process. A readiness probe that pings the database is added at
 * cutover, once the hosting target defines who calls it (ADR 0004).
 */
export function GET() {
  return NextResponse.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } })
}
