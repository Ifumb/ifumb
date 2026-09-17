import 'server-only'
import type { Invitation } from '@/core/entities/invitation'
import type { PersonName } from '@/core/use-cases/ports/tree-reader'

/** An invitation as its owner sees it, alongside the collaborator it links to once accepted. */
export type CollaboratorView = {
  readonly invitation: Invitation
  readonly user: PersonName | null
}

/** Read side of invitations. */
export interface InvitationReader {
  findByToken(token: string): Promise<Invitation | null>
  findById(invitationId: string): Promise<Invitation | null>
  /** The one invitation `(treeId, email)` may ever have, whatever its status. */
  findByTreeAndEmail(treeId: string, email: string): Promise<Invitation | null>
  /** Every invitation of a tree, newest first, for its owner. */
  listForTree(treeId: string): Promise<readonly CollaboratorView[]>
}
