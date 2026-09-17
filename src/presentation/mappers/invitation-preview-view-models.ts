import type { InvitationPreview } from '@/core/use-cases/get-invitation-by-token'
import { ROLE_LABELS } from '@/presentation/labels/tree-labels'

export type InvitationPreviewViewModel = {
  readonly invitationId: string
  readonly treeId: string
  readonly treeName: string
  readonly inviterName: string
  readonly roleLabel: string
}

export function toInvitationPreviewViewModel(preview: InvitationPreview): InvitationPreviewViewModel {
  return {
    invitationId: preview.invitationId,
    treeId: preview.treeId,
    treeName: preview.treeName,
    inviterName: preview.inviterName,
    roleLabel: ROLE_LABELS[preview.role],
  }
}
