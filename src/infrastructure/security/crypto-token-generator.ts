import 'server-only'
import { randomBytes } from 'node:crypto'
import type { TokenGenerator } from '@/core/use-cases/ports/token-generator'

/** 256 bits of entropy, hex-encoded — the legacy reset token format. */
const TOKEN_BYTES = 32

export class CryptoTokenGenerator implements TokenGenerator {
  generate(): string {
    return randomBytes(TOKEN_BYTES).toString('hex')
  }
}
