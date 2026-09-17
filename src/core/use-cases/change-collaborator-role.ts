import 'server-only'
import type { InvitationNotAccepted } from '@/core/entities/invitation'
import type { InvitationRole } from '@/core/entities/tree'
import { err, ok, type Result } from '@/core/shared/result'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { InvitationReader } from '@/core/use-cases/ports/invitation-reader'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import { manageableTree, type TreeManagementError } from '@/core/use-cases/tree-management-access'

export type ChangeCollaboratorRoleInput = {
  readonly treeId: string
  readonly viewerId: string
  readonly invitationId: string
  readonly role: InvitationRole
}

export type ChangeCollaboratorRoleError =
  | TreeManagementError
  | { readonly kind: 'INVITATION_NOT_FOUND' }
  | InvitationNotAccepted

type ChangeCollaboratorRoleDeps = {
  readonly trees: TreeReader
  readonly invitations: InvitationReader
  readonly unitOfWork: UnitOfWork
  readonly ids: IdGenerator
  readonly clock: Clock
}

/** The owner changes an already-accepted collaborator's role. */
export class ChangeCollaboratorRoleUseCase {
  constructor(private readonly deps: ChangeCollaboratorRoleDeps) {}

  async execute(
    input: ChangeCollaboratorRoleInput,
  ): Promise<Result<void, ChangeCollaboratorRoleError>> {
    const access = await manageableTree(this.deps.trees, input)
    if (!access.ok) return access

    const invitation = await this.deps.invitations.findById(input.invitationId)
    if (!invitation || invitation.treeId !== input.treeId) {
      return err({ kind: 'INVITATION_NOT_FOUND' })
    }
    const now = this.deps.clock.now()
    const changed = invitation.changeRole(input.role, now)
    if (!changed.ok) return changed
    if (changed.value === invitation) return ok(undefined)

    await this.deps.unitOfWork.runInTransaction(async (context) => {
      await context.invitations.changeRole(changed.value)
      await context.auditLog.record({
        id: this.deps.ids.next(),
        treeId: input.treeId,
        authorId: input.viewerId,
        action: 'ROLE_CHANGED',
        targetType: 'INVITATION',
        targetId: invitation.id,
        diff: { before: { role: invitation.role }, after: { role: input.role } },
        createdAt: now,
      })
    })
    return ok(undefined)
  }
}
