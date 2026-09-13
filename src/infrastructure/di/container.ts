import 'server-only'
import { AuthenticateUserUseCase } from '@/core/use-cases/authenticate-user'
import { ChangePasswordUseCase } from '@/core/use-cases/change-password'
import { GetTreeOverviewUseCase } from '@/core/use-cases/get-tree-overview'
import { ListUserTreesUseCase } from '@/core/use-cases/list-user-trees'
import { RegisterUserUseCase } from '@/core/use-cases/register-user'
import { RequestPasswordResetUseCase } from '@/core/use-cases/request-password-reset'
import type { RateLimiter } from '@/core/use-cases/ports/rate-limiter'
import { ResetPasswordUseCase } from '@/core/use-cases/reset-password'
import { requireServerEnv } from '@/infrastructure/config/server-env'
import { ResendPasswordResetMailer } from '@/infrastructure/mail/resend-password-reset-mailer'
import { getPrismaClient } from '@/infrastructure/persistence/prisma/client'
import { PrismaTreeReader } from '@/infrastructure/persistence/prisma/prisma-tree-reader'
import { PrismaUserRepository } from '@/infrastructure/persistence/prisma/prisma-user-repository'
import { isAttemptAllowed, type AttemptKey } from '@/infrastructure/rate-limiting/attempt-guard'
import { InMemoryRateLimiter } from '@/infrastructure/rate-limiting/in-memory-rate-limiter'
import {
  RATE_LIMIT_POLICIES,
  type RateLimitPolicyName,
} from '@/infrastructure/rate-limiting/rate-limit-policies'
import { BcryptjsPasswordHasher } from '@/infrastructure/security/bcryptjs-password-hasher'
import { CryptoTokenGenerator } from '@/infrastructure/security/crypto-token-generator'
import { SystemClock } from '@/infrastructure/system/system-clock'
import { UuidIdGenerator } from '@/infrastructure/system/uuid-id-generator'

/** Memoizes a factory so each dependency is built once, on first use. */
function lazy<T>(create: () => T): () => T {
  let instance: T | undefined
  return () => (instance ??= create())
}

const globalForRateLimiters = globalThis as unknown as { ifumbRateLimiters?: RateLimiters }

type RateLimiters = Readonly<Record<RateLimitPolicyName, RateLimiter>>

const users = lazy(() => new PrismaUserRepository(getPrismaClient()))
const trees = lazy(() => new PrismaTreeReader(getPrismaClient()))
const hasher = lazy(() => new BcryptjsPasswordHasher())
const clock = lazy(() => new SystemClock())

/**
 * reason: anchored on globalThis, like the Prisma client. Server Actions and the Auth.js route
 * handler can be bundled into separate module graphs; module-level counters would then exist
 * twice, and attempts made through one entry point would not count against the other.
 */
function rateLimiters(): RateLimiters {
  globalForRateLimiters.ifumbRateLimiters ??= buildRateLimiters()
  return globalForRateLimiters.ifumbRateLimiters
}

function buildRateLimiters(): RateLimiters {
  const entries = Object.entries(RATE_LIMIT_POLICIES).map(([name, policy]) => [
    name,
    new InMemoryRateLimiter({ ...policy, clock: clock() }),
  ])
  return Object.fromEntries(entries) as RateLimiters
}
const passwordResetMailer = lazy(
  () =>
    new ResendPasswordResetMailer({
      apiKey: requireServerEnv('RESEND_API_KEY'),
      from: requireServerEnv('RESEND_FROM'),
      appUrl: requireServerEnv('APP_URL'),
    }),
)

// reason: every dependency is resolved lazily (`container.x()` rather than `container.x`), so that
// importing this module during `next build` never requires database or mail secrets.
export const container = {
  /** Charges one attempt to each budget; false as soon as any of them is exhausted. */
  allowsAttempt: (keys: readonly AttemptKey[]) => isAttemptAllowed(rateLimiters(), keys),
  registerUser: lazy(
    () =>
      new RegisterUserUseCase({
        users: users(),
        hasher: hasher(),
        ids: new UuidIdGenerator(),
        clock: clock(),
      }),
  ),
  authenticateUser: lazy(() => new AuthenticateUserUseCase({ users: users(), hasher: hasher() })),
  changePassword: lazy(() => new ChangePasswordUseCase({ users: users(), hasher: hasher() })),
  requestPasswordReset: lazy(
    () =>
      new RequestPasswordResetUseCase({
        users: users(),
        tokens: new CryptoTokenGenerator(),
        mailer: passwordResetMailer(),
        clock: clock(),
      }),
  ),
  resetPassword: lazy(
    () => new ResetPasswordUseCase({ users: users(), hasher: hasher(), clock: clock() }),
  ),
  listUserTrees: lazy(() => new ListUserTreesUseCase({ trees: trees() })),
  getTreeOverview: lazy(() => new GetTreeOverviewUseCase({ trees: trees() })),
}
