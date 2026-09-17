import 'server-only'
import type { Invitation } from '@/core/entities/invitation'
import type { CollaboratorView, InvitationReader } from '@/core/use-cases/ports/invitation-reader'
import type { PersonName } from '@/core/use-cases/ports/tree-reader'

/** Test double of the invitation reader. */
export class InMemoryInvitationReader implements InvitationReader {
  private readonly byId = new Map<string, Invitation>()
  private readonly users = new Map<string, PersonName>()

  /** Seeds one invitation, with the collaborator name `listForTree` shows once it is accepted. */
  seed(invitation: Invitation, user?: PersonName): void {
    this.byId.set(invitation.id, invitation)
    if (user) this.users.set(invitation.id, user)
  }

  async findByToken(token: string): Promise<Invitation | null> {
    return [...this.byId.values()].find((invitation) => invitation.token === token) ?? null
  }

  async findById(invitationId: string): Promise<Invitation | null> {
    return this.byId.get(invitationId) ?? null
  }

  async findByTreeAndEmail(treeId: string, email: string): Promise<Invitation | null> {
    const match = [...this.byId.values()].find(
      (invitation) => invitation.treeId === treeId && invitation.email === email,
    )
    return match ?? null
  }

  async listForTree(treeId: string): Promise<readonly CollaboratorView[]> {
    return [...this.byId.values()]
      .filter((invitation) => invitation.treeId === treeId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((invitation) => ({ invitation, user: this.users.get(invitation.id) ?? null }))
  }
}
