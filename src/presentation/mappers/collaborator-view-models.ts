import type { InvitationRole } from '@/core/entities/tree'
import type { CollaboratorsList } from '@/core/use-cases/list-collaborators'
import type { CollaboratorView } from '@/core/use-cases/ports/invitation-reader'
import { INVITATION_STATUS_LABELS } from '@/presentation/labels/invitation-labels'
import { ROLE_LABELS } from '@/presentation/labels/tree-labels'

export type CollaboratorItemViewModel = {
  readonly id: string
  readonly displayName: string
  readonly email: string
  readonly role: InvitationRole
  readonly roleLabel: string
  readonly statusLabel: string
  /** Only an accepted invitation names an actual collaborator whose role can change. */
  readonly canChangeRole: boolean
  readonly revokeHref: `/tree/${string}/collaborators/${string}/revoke`
}

export type CollaboratorsViewModel = {
  readonly treeId: string
  readonly treeName: string
  readonly collaborators: readonly CollaboratorItemViewModel[]
}

export function toCollaboratorsViewModel(
  treeId: string,
  list: CollaboratorsList,
): CollaboratorsViewModel {
  return {
    treeId,
    treeName: list.treeName,
    collaborators: list.collaborators.map((collaborator) => toItem(treeId, collaborator)),
  }
}

function toItem(treeId: string, { invitation, user }: CollaboratorView): CollaboratorItemViewModel {
  return {
    id: invitation.id,
    displayName: user ? `${user.firstName} ${user.lastName}` : invitation.email,
    email: invitation.email,
    role: invitation.role,
    roleLabel: ROLE_LABELS[invitation.role],
    statusLabel: INVITATION_STATUS_LABELS[invitation.status],
    canChangeRole: invitation.status === 'ACCEPTED',
    revokeHref: `/tree/${treeId}/collaborators/${invitation.id}/revoke`,
  }
}
