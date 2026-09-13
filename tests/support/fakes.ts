import type { Clock } from '@/core/use-cases/ports/clock'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { PasswordHasher } from '@/core/use-cases/ports/password-hasher'
import type {
  PasswordResetMailer,
  PasswordResetMessage,
} from '@/core/use-cases/ports/password-reset-mailer'
import type { TokenGenerator } from '@/core/use-cases/ports/token-generator'

const HASH_PREFIX = 'hashed:'

/** Deterministic, instant stand-in for bcrypt: the hash of `x` is `hashed:x`. */
export class FakePasswordHasher implements PasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    return `${HASH_PREFIX}${plainPassword}`
  }

  async matches(plainPassword: string, passwordHash: string): Promise<boolean> {
    return passwordHash === `${HASH_PREFIX}${plainPassword}`
  }
}

export class FixedClock implements Clock {
  constructor(private readonly instant: Date) {}

  now(): Date {
    return this.instant
  }
}

/** A clock the test moves forward explicitly, for time-window rules. */
export class ManualClock implements Clock {
  constructor(private instant: Date) {}

  now(): Date {
    return this.instant
  }

  advanceBy(milliseconds: number): void {
    this.instant = new Date(this.instant.getTime() + milliseconds)
  }
}

export class SequentialIdGenerator implements IdGenerator {
  private issued = 0

  next(): string {
    this.issued += 1
    return `usr_${this.issued}`
  }
}

export class SequentialTokenGenerator implements TokenGenerator {
  private issued = 0

  generate(): string {
    this.issued += 1
    return `token-${this.issued}`
  }
}

export class RecordingPasswordResetMailer implements PasswordResetMailer {
  readonly sent: PasswordResetMessage[] = []

  async sendResetLink(message: PasswordResetMessage): Promise<void> {
    this.sent.push(message)
  }
}
