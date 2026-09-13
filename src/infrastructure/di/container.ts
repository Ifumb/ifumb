import 'server-only'
import { AuthenticateUserUseCase } from '@/core/use-cases/authenticate-user'
import { ChangePasswordUseCase } from '@/core/use-cases/change-password'
import { RegisterUserUseCase } from '@/core/use-cases/register-user'
import { RequestPasswordResetUseCase } from '@/core/use-cases/request-password-reset'
import { ResetPasswordUseCase } from '@/core/use-cases/reset-password'
import { requireServerEnv } from '@/infrastructure/config/server-env'
import { ResendPasswordResetMailer } from '@/infrastructure/mail/resend-password-reset-mailer'
import { getPrismaClient } from '@/infrastructure/persistence/prisma/client'
import { PrismaUserRepository } from '@/infrastructure/persistence/prisma/prisma-user-repository'
import { BcryptjsPasswordHasher } from '@/infrastructure/security/bcryptjs-password-hasher'
import { CryptoTokenGenerator } from '@/infrastructure/security/crypto-token-generator'
import { SystemClock } from '@/infrastructure/system/system-clock'
import { UuidIdGenerator } from '@/infrastructure/system/uuid-id-generator'

/** Memoizes a factory so each dependency is built once, on first use. */
function lazy<T>(create: () => T): () => T {
  let instance: T | undefined
  return () => (instance ??= create())
}

const users = lazy(() => new PrismaUserRepository(getPrismaClient()))
const hasher = lazy(() => new BcryptjsPasswordHasher())
const clock = lazy(() => new SystemClock())
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
}
