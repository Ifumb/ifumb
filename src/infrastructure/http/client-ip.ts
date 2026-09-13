import 'server-only'
import { headers } from 'next/headers'

const UNKNOWN_CLIENT = 'unknown'

type HeaderSource = { get(name: string): string | null }

/**
 * Best-effort client IP for rate-limit keys.
 * reason: `x-forwarded-for` is only trustworthy behind a proxy that overwrites it, and the hosting
 * target is decided at cutover (ADR 0004). Until then a client can forge it, which is why every
 * sensitive flow also limits by email or user id, never by IP alone.
 */
export function clientIpFrom(headers: HeaderSource): string {
  const forwardedFor = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwardedFor || headers.get('x-real-ip')?.trim() || UNKNOWN_CLIENT
}

/** Client IP of the request currently being handled (Server Action or Server Component). */
export async function currentClientIp(): Promise<string> {
  return clientIpFrom(await headers())
}
