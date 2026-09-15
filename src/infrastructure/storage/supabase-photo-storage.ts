import 'server-only'
import type { NormalizedPhoto } from '@/core/use-cases/ports/photo-processor'
import type { PhotoStorage } from '@/core/use-cases/ports/photo-storage'
import { BusinessWritesDisabledError } from '@/infrastructure/config/business-writes'
import { retryWithBackoff, type RetryOptions } from '@/infrastructure/resilience/retry-with-backoff'
import { TimeoutError, withTimeout } from '@/infrastructure/resilience/with-timeout'

export type SupabasePhotoStorageConfig = {
  /** The Supabase project URL, such as `https://abc.supabase.co`. */
  readonly projectUrl: string
  /** The service role key: server-side only, never logged. */
  readonly serviceRoleKey: string
  readonly writesEnabled: boolean
  readonly timeoutMs?: number
  readonly removalRetry?: RetryOptions
}

/** A refused Storage request, carrying only its HTTP status (never the key or the body). */
export class StorageRequestError extends Error {
  constructor(readonly status: number) {
    super(`Supabase Storage answered HTTP ${status}`)
    this.name = 'StorageRequestError'
  }
}

const BUCKET = 'member-photos'
const DEFAULT_TIMEOUT_MS = 10_000
const DEFAULT_REMOVAL_RETRY: RetryOptions = { maxAttempts: 3, baseDelayMs: 200, maxDelayMs: 2_000 }
// Every stored name is new, so a published photo never changes: browsers and CDNs may keep it.
const ONE_YEAR_SECONDS = 31_536_000

/**
 * Member photos in the legacy Supabase Storage bucket, through its REST API.
 * reason: the upload happens here, on the server, with the service role key, after every check —
 * the legacy browser upload trusted an anonymous key with any path (ADR 0007).
 */
export class SupabasePhotoStorage implements PhotoStorage {
  private readonly origin: string

  constructor(private readonly config: SupabasePhotoStorageConfig) {
    this.origin = new URL(config.projectUrl).origin
  }

  /** Where the bucket publishes its files; photos elsewhere are never removed. */
  get publicBase(): string {
    return `${this.origin}/storage/v1/object/public/${BUCKET}/`
  }

  async save(path: string, photo: NormalizedPhoto): Promise<string> {
    this.assertWritesEnabled()
    const response = await this.request(`${this.origin}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'POST',
      headers: {
        'content-type': photo.contentType,
        'cache-control': `max-age=${ONE_YEAR_SECONDS}`,
        'x-upsert': 'false',
      },
      body: Buffer.from(photo.bytes),
    })
    if (!response.ok) throw reported('stored', new StorageRequestError(response.status))
    return `${this.publicBase}${path}`
  }

  async remove(url: string): Promise<void> {
    if (!url.startsWith(this.publicBase)) return
    this.assertWritesEnabled()
    const path = decodeURIComponent(url.slice(this.publicBase.length))
    const retry = this.config.removalRetry ?? DEFAULT_REMOVAL_RETRY
    await retryWithBackoff(() => this.deleteObject(path), isTransient, retry).catch((error) => {
      throw reported('removed', error)
    })
  }

  private async deleteObject(path: string): Promise<void> {
    const response = await this.request(`${this.origin}/storage/v1/object/${BUCKET}`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prefixes: [path] }),
    })
    if (!response.ok) throw new StorageRequestError(response.status)
  }

  private request(url: string, init: RequestInit): Promise<Response> {
    const headers = {
      ...init.headers,
      authorization: `Bearer ${this.config.serviceRoleKey}`,
      apikey: this.config.serviceRoleKey,
    }
    return withTimeout(
      fetch(url, { ...init, headers }),
      this.config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    )
  }

  private assertWritesEnabled(): void {
    if (!this.config.writesEnabled) throw new BusinessWritesDisabledError()
  }
}

/** Network failures, timeouts, throttling and server errors may clear up; refusals will not. */
function isTransient(error: unknown): boolean {
  if (error instanceof StorageRequestError) return error.status === 429 || error.status >= 500
  return error instanceof TimeoutError || error instanceof TypeError
}

function reported(action: 'stored' | 'removed', error: unknown): unknown {
  const reason = error instanceof Error ? error.message : 'unknown error'
  console.error(`Member photo could not be ${action}: ${reason}`)
  return error
}
