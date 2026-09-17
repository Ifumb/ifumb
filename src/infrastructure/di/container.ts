import 'server-only'
import { AuthenticateUserUseCase } from '@/core/use-cases/authenticate-user'
import { ChangePasswordUseCase } from '@/core/use-cases/change-password'
import { GetAuditLogUseCase } from '@/core/use-cases/get-audit-log'
import { ApprovePendingChangeUseCase } from '@/core/use-cases/approve-pending-change'
import { GetNotificationsUseCase } from '@/core/use-cases/get-notifications'
import { GetUnreadNotificationCountUseCase } from '@/core/use-cases/get-unread-notification-count'
import { GetPendingChangesUseCase } from '@/core/use-cases/get-pending-changes'
import { MarkAllNotificationsReadUseCase } from '@/core/use-cases/mark-all-notifications-read'
import { MarkNotificationReadUseCase } from '@/core/use-cases/mark-notification-read'
import { RejectPendingChangeUseCase } from '@/core/use-cases/reject-pending-change'
import { ReviewAllPendingChangesUseCase } from '@/core/use-cases/review-all-pending-changes'
import { CreateMemberUseCase } from '@/core/use-cases/create-member'
import { CreateTreeUseCase } from '@/core/use-cases/create-tree'
import { DeleteMemberUseCase } from '@/core/use-cases/delete-member'
import { ExplorePublicTreesUseCase } from '@/core/use-cases/explore-public-trees'
import { FindCommonAncestorsUseCase } from '@/core/use-cases/find-common-ancestors'
import { FindKinshipUseCase } from '@/core/use-cases/find-kinship'
import { GetFamilyGraphUseCase } from '@/core/use-cases/get-family-graph'
import { GetTreeSettingsUseCase } from '@/core/use-cases/get-tree-settings'
import { GetMemberFormUseCase } from '@/core/use-cases/get-member-form'
import { GetMemberProfileUseCase } from '@/core/use-cases/get-member-profile'
import { GetTreeOverviewUseCase } from '@/core/use-cases/get-tree-overview'
import { ListTreeMembersUseCase } from '@/core/use-cases/list-tree-members'
import { ListUserTreesUseCase } from '@/core/use-cases/list-user-trees'
import { RegisterUserUseCase } from '@/core/use-cases/register-user'
import { RequestPasswordResetUseCase } from '@/core/use-cases/request-password-reset'
import type { RateLimiter } from '@/core/use-cases/ports/rate-limiter'
import { SearchPublicMembersUseCase } from '@/core/use-cases/search-public-members'
import { UpdateMemberUseCase } from '@/core/use-cases/update-member'
import { UpdateTreeUseCase } from '@/core/use-cases/update-tree'
import { ResetPasswordUseCase } from '@/core/use-cases/reset-password'
import { businessWritesEnabled } from '@/infrastructure/config/business-writes'
import { requireServerEnv } from '@/infrastructure/config/server-env'
import { lazy } from '@/infrastructure/di/lazy'
import { configuredPhotoStorage, photoUseCases } from '@/infrastructure/di/photo-use-cases'
import { SharpPhotoProcessor } from '@/infrastructure/images/sharp-photo-processor'
import { unionUseCases, type TreeContentWriteDeps } from '@/infrastructure/di/union-use-cases'
import { ResendPasswordResetMailer } from '@/infrastructure/mail/resend-password-reset-mailer'
import { ResendPendingChangeAlertMailer } from '@/infrastructure/mail/resend-pending-change-alert-mailer'
import { getPrismaClient } from '@/infrastructure/persistence/prisma/client'
import { PrismaAuditLogReader } from '@/infrastructure/persistence/prisma/prisma-audit-log-reader'
import { PrismaFamilyReader } from '@/infrastructure/persistence/prisma/prisma-family-reader'
import { RequestScopedFamilyReader } from '@/infrastructure/persistence/request-scoped-family-reader'
import { PrismaUnitOfWork } from '@/infrastructure/persistence/prisma/prisma-unit-of-work'
import { PrismaPublicMemberDirectory } from '@/infrastructure/persistence/prisma/prisma-public-member-directory'
import { PrismaPublicTreeCatalog } from '@/infrastructure/persistence/prisma/prisma-public-tree-catalog'
import { PrismaNotificationReader } from '@/infrastructure/persistence/prisma/prisma-notification-reader'
import { PrismaNotificationWriter } from '@/infrastructure/persistence/prisma/prisma-notification-writer'
import { PrismaPendingChangeReader } from '@/infrastructure/persistence/prisma/prisma-pending-change-reader'
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

const globalForRateLimiters = globalThis as unknown as { ifumbRateLimiters?: RateLimiters }

type RateLimiters = Readonly<Record<RateLimitPolicyName, RateLimiter>>

const users = lazy(() => new PrismaUserRepository(getPrismaClient()))
const trees = lazy(() => new PrismaTreeReader(getPrismaClient()))
const families = lazy(
  () => new RequestScopedFamilyReader(new PrismaFamilyReader(getPrismaClient())),
)
const pendingChanges = lazy(() => new PrismaPendingChangeReader(getPrismaClient()))
const notificationReader = lazy(() => new PrismaNotificationReader(getPrismaClient()))
// reason: standalone, never through the unit of work — marking a notification read is not a
// business write and does not belong in that transaction (see `ports/unit-of-work.ts`).
const notificationWriter = lazy(() => new PrismaNotificationWriter(getPrismaClient()))
const unitOfWork = lazy(
  () => new PrismaUnitOfWork(getPrismaClient(), { writesEnabled: businessWritesEnabled() }),
)
const ids = lazy(() => new UuidIdGenerator())
const treeContentWrites = (): TreeContentWriteDeps => ({
  trees: trees(),
  families: families(),
  unitOfWork: unitOfWork(),
  ids: ids(),
  clock: clock(),
  storage: configuredPhotoStorage(),
  users: users(),
  pendingChanges: pendingChanges(),
  // reason: a getter, not a resolved value — this object is also handed to read-only use cases
  // (forms, photos, child links) that never touch `.mailer`. A resolved value would construct the
  // Resend mailer, and so require RESEND_API_KEY/RESEND_FROM, on every one of those reads too.
  get mailer() {
    return pendingChangeAlertMailer()
  },
})
const photoProcessor = lazy(() => new SharpPhotoProcessor())
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
const pendingChangeAlertMailer = lazy(
  () =>
    new ResendPendingChangeAlertMailer({
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
        ids: ids(),
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
  listTreeMembers: lazy(() => new ListTreeMembersUseCase({ trees: trees(), families: families() })),
  getMemberProfile: lazy(
    () => new GetMemberProfileUseCase({ trees: trees(), families: families() }),
  ),
  getFamilyGraph: lazy(
    () =>
      new GetFamilyGraphUseCase({
        trees: trees(),
        families: families(),
        pendingChanges: pendingChanges(),
      }),
  ),
  findKinship: lazy(() => new FindKinshipUseCase({ trees: trees(), families: families() })),
  createTree: lazy(
    () => new CreateTreeUseCase({ unitOfWork: unitOfWork(), ids: ids(), clock: clock() }),
  ),
  updateTree: lazy(
    () =>
      new UpdateTreeUseCase({
        trees: trees(),
        unitOfWork: unitOfWork(),
        ids: ids(),
        clock: clock(),
      }),
  ),
  getTreeSettings: lazy(() => new GetTreeSettingsUseCase({ trees: trees() })),
  createMember: lazy(() => new CreateMemberUseCase(treeContentWrites())),
  updateMember: lazy(() => new UpdateMemberUseCase(treeContentWrites())),
  deleteMember: lazy(() => new DeleteMemberUseCase(treeContentWrites())),
  getMemberForm: lazy(() => new GetMemberFormUseCase({ trees: trees(), families: families() })),
  ...unionUseCases(treeContentWrites),
  // reason: Object.assign, not a spread — treeContentWrites()'s `mailer` is a getter (see there),
  // and `{ ...treeContentWrites(), photos: photoProcessor() }` would read it eagerly while copying
  // it into the new object literal, defeating its laziness for the photo use cases, which never
  // read it at all.
  ...photoUseCases(() => Object.assign(treeContentWrites(), { photos: photoProcessor() })),
  getAuditLog: lazy(
    () =>
      new GetAuditLogUseCase({
        trees: trees(),
        auditLog: new PrismaAuditLogReader(getPrismaClient()),
      }),
  ),
  exploreTrees: lazy(
    () =>
      new ExplorePublicTreesUseCase({ catalog: new PrismaPublicTreeCatalog(getPrismaClient()) }),
  ),
  searchMembers: lazy(
    () =>
      new SearchPublicMembersUseCase({
        directory: new PrismaPublicMemberDirectory(getPrismaClient()),
      }),
  ),
  findCommonAncestors: lazy(
    () => new FindCommonAncestorsUseCase({ trees: trees(), families: families() }),
  ),
  getPendingChanges: lazy(
    () => new GetPendingChangesUseCase({ trees: trees(), pendingChanges: pendingChanges() }),
  ),
  // reason: `treeContentWrites()` already carries everything these three need (and more, unused,
  // structurally harmless) — passed straight through, never spread, so its `mailer` getter stays
  // lazy and these three, which never send mail, never construct one.
  approvePendingChange: lazy(() => new ApprovePendingChangeUseCase(treeContentWrites())),
  rejectPendingChange: lazy(() => new RejectPendingChangeUseCase(treeContentWrites())),
  reviewAllPendingChanges: lazy(() => new ReviewAllPendingChangesUseCase(treeContentWrites())),
  getNotifications: lazy(
    () => new GetNotificationsUseCase({ notifications: notificationReader() }),
  ),
  getUnreadNotificationCount: lazy(
    () => new GetUnreadNotificationCountUseCase({ notifications: notificationReader() }),
  ),
  markNotificationRead: lazy(
    () => new MarkNotificationReadUseCase({ notifications: notificationWriter() }),
  ),
  markAllNotificationsRead: lazy(
    () => new MarkAllNotificationsReadUseCase({ notifications: notificationWriter() }),
  ),
}
