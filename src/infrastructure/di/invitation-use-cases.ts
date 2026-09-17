import 'server-only'
import { ChangeCollaboratorRoleUseCase } from '@/core/use-cases/change-collaborator-role'
import { ClaimMemberUseCase } from '@/core/use-cases/claim-member'
import { GetInvitationByTokenUseCase } from '@/core/use-cases/get-invitation-by-token'
import { ListCollaboratorsUseCase } from '@/core/use-cases/list-collaborators'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { FamilyReader } from '@/core/use-cases/ports/family-reader'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { InvitationMailer } from '@/core/use-cases/ports/invitation-mailer'
import type { InvitationReader } from '@/core/use-cases/ports/invitation-reader'
import type { MemberClaimReader } from '@/core/use-cases/ports/member-claim-reader'
import type { TokenGenerator } from '@/core/use-cases/ports/token-generator'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import type { UserRepository } from '@/core/use-cases/ports/user-repository'
import { RespondToInvitationUseCase } from '@/core/use-cases/respond-to-invitation'
import { RevokeInvitationUseCase } from '@/core/use-cases/revoke-invitation'
import { SendInvitationUseCase } from '@/core/use-cases/send-invitation'
import { lazy } from '@/infrastructure/di/lazy'

export type InvitationWriteDeps = {
  readonly trees: TreeReader
  readonly families: FamilyReader
  readonly invitations: InvitationReader
  readonly memberClaims: MemberClaimReader
  readonly users: UserRepository
  readonly unitOfWork: UnitOfWork
  readonly ids: IdGenerator
  readonly tokens: TokenGenerator
  readonly clock: Clock
  readonly mailer: InvitationMailer
}

/**
 * The invitation and claim use cases, each built lazily like the rest of the container.
 * reason: kept apart from `container.ts` so that it stays under the size limit.
 */
export function invitationUseCases(deps: () => InvitationWriteDeps) {
  return {
    sendInvitation: lazy(() => new SendInvitationUseCase(deps())),
    getInvitationByToken: lazy(() => new GetInvitationByTokenUseCase(deps())),
    respondToInvitation: lazy(() => new RespondToInvitationUseCase(deps())),
    listCollaborators: lazy(() => new ListCollaboratorsUseCase(deps())),
    changeCollaboratorRole: lazy(() => new ChangeCollaboratorRoleUseCase(deps())),
    revokeInvitation: lazy(() => new RevokeInvitationUseCase(deps())),
    claimMember: lazy(() => new ClaimMemberUseCase(deps())),
  }
}
