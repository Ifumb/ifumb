import type { ConnectionRequestView } from '@/core/use-cases/ports/connection-request-reader'

const DELETED_MEMBER_LABEL = 'Membre supprimé'

export type ConnectionRequestItemViewModel = {
  readonly id: string
  readonly requesterTreeName: string
  readonly requesterMemberName: string
  readonly targetMemberName: string
  readonly createdAtIso: string
  readonly expiresAtIso: string
}

export function toConnectionRequestItems(
  views: readonly ConnectionRequestView[],
): readonly ConnectionRequestItemViewModel[] {
  return views.map(toItem)
}

function toItem(view: ConnectionRequestView): ConnectionRequestItemViewModel {
  return {
    id: view.request.id,
    requesterTreeName: view.requesterTreeName,
    requesterMemberName: view.requesterMemberName ?? DELETED_MEMBER_LABEL,
    targetMemberName: view.targetMemberName ?? DELETED_MEMBER_LABEL,
    createdAtIso: view.request.createdAt.toISOString(),
    expiresAtIso: view.request.expiresAt.toISOString(),
  }
}
