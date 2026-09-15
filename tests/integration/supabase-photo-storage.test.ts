import { createServer, type IncomingMessage, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { BusinessWritesDisabledError } from '@/infrastructure/config/business-writes'
import { TimeoutError } from '@/infrastructure/resilience/with-timeout'
import {
  StorageRequestError,
  SupabasePhotoStorage,
} from '@/infrastructure/storage/supabase-photo-storage'

type Received = { method: string; url: string; headers: IncomingMessage['headers']; body: Buffer }

const received: Received[] = []
let answers: number[] = []
let delayMs = 0
let server: Server
let projectUrl = ''

beforeAll(async () => {
  server = createServer((request, response) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', () => {
      const { method = '', url = '', headers } = request
      received.push({ method, url, headers, body: Buffer.concat(chunks) })
      setTimeout(() => response.writeHead(answers.shift() ?? 200).end('{}'), delayMs)
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  projectUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())))

beforeEach(() => {
  received.length = 0
  answers = []
  delayMs = 0
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

const storage = (overrides: { writesEnabled?: boolean; timeoutMs?: number } = {}) =>
  new SupabasePhotoStorage({
    projectUrl,
    serviceRoleKey: 'service-role-key',
    writesEnabled: overrides.writesEnabled ?? true,
    timeoutMs: overrides.timeoutMs,
    removalRetry: { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 2 },
  })

const photo = { bytes: Uint8Array.from([1, 2, 3]), contentType: 'image/webp' } as const

describe('SupabasePhotoStorage', () => {
  it('uploads a new object with the service key and returns its public URL', async () => {
    const url = await storage().save('tree_1/mbr_awa-abc.webp', photo)

    expect(url).toBe(`${projectUrl}/storage/v1/object/public/member-photos/tree_1/mbr_awa-abc.webp`)
    const [request] = received
    expect([request?.method, request?.url, request?.body]).toEqual([
      'POST',
      '/storage/v1/object/member-photos/tree_1/mbr_awa-abc.webp',
      Buffer.from([1, 2, 3]),
    ])
    expect(request?.headers).toMatchObject({
      authorization: 'Bearer service-role-key',
      apikey: 'service-role-key',
      'content-type': 'image/webp',
      'x-upsert': 'false',
    })
  })

  it('reports a refused upload by its status only', async () => {
    answers = [403]

    const attempt = storage().save('tree_1/mbr_awa-abc.webp', photo)

    await expect(attempt).rejects.toEqual(new StorageRequestError(403))
    expect(console.error).toHaveBeenCalledWith(
      'Member photo could not be stored: Supabase Storage answered HTTP 403',
    )
  })

  it('gives up on a storage that does not answer in time', async () => {
    delayMs = 200

    await expect(storage({ timeoutMs: 20 }).save('tree_1/a.webp', photo)).rejects.toBeInstanceOf(
      TimeoutError,
    )
  })

  it('removes an object of its bucket, retrying a temporary failure', async () => {
    answers = [503, 200]
    const url = `${projectUrl}/storage/v1/object/public/member-photos/tree_1/mbr_awa.jpg`

    await storage().remove(url)

    expect(received.map(({ method, url: path }) => [method, path])).toEqual([
      ['DELETE', '/storage/v1/object/member-photos'],
      ['DELETE', '/storage/v1/object/member-photos'],
    ])
    expect(JSON.parse(received[1]?.body.toString() ?? '')).toEqual({
      prefixes: ['tree_1/mbr_awa.jpg'],
    })
  })

  it('leaves alone a URL published anywhere else', async () => {
    await storage().remove('https://elsewhere.test/storage/v1/object/public/member-photos/x.jpg')

    expect(received).toEqual([])
  })

  it('refuses to write while business writes are disabled', async () => {
    const disabled = storage({ writesEnabled: false })

    await expect(disabled.save('tree_1/a.webp', photo)).rejects.toBeInstanceOf(
      BusinessWritesDisabledError,
    )
    expect(received).toEqual([])
  })
})
