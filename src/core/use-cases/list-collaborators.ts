import 'server-only'
import { ok, type Result } from '@/core/shared/result'
import type { CollaboratorView, InvitationReader } from '@/core/use-cases/ports/invitation-reader'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import { manageableTree, type TreeManagementError } from '@/core/use-cases/tree-management-access'

export type ListCollaboratorsInput = { readonly treeId: string; readonly viewerId: string }

export type CollaboratorsList = {
  readonly treeName: string
  readonly collaborators: readonly CollaboratorView[]
}

type ListCollaboratorsDeps = { readonly trees: TreeReader; readonly invitations: InvitationReader }

/** For the owner: every invitation sent on this tree, whatever its status. */
export class ListCollaboratorsUseCase {
  constructor(private readonly deps: ListCollaboratorsDeps) {}

  async execute(
    input: ListCollaboratorsInput,
  ): Promise<Result<CollaboratorsList, TreeManagementError>> {
    const access = await manageableTree(this.deps.trees, input)
    if (!access.ok) return access
    const collaborators = await this.deps.invitations.listForTree(input.treeId)
    return ok({ treeName: access.value.listing.tree.name, collaborators })
  }
}
