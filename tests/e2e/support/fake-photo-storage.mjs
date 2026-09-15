// A stand-in for Supabase Storage during the end-to-end suite: it accepts uploads and removals of
// member photos, so that no test ever reaches a real bucket. Started by playwright.config.ts.
import { createServer } from 'node:http'

const port = Number(process.env.FAKE_STORAGE_PORT ?? 3924)
const OBJECT_PATH = '/storage/v1/object/member-photos'

const server = createServer((request, response) => {
  request.resume()
  request.on('end', () => {
    const known =
      request.url === '/health' ||
      (request.method === 'POST' && request.url?.startsWith(`${OBJECT_PATH}/`)) ||
      (request.method === 'DELETE' && request.url === OBJECT_PATH)
    response.writeHead(known ? 200 : 404, { 'content-type': 'application/json' }).end('{}')
  })
})

server.listen(port, '127.0.0.1')
