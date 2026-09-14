import 'server-only'
import type { TreeDetails } from '@/core/entities/tree'
import { ok, type Result } from '@/core/shared/result'
import type { TreeReader } from '@/core/use-cases/ports/tree-reader'
import type { TreeReadInput } from '@/core/use-cases/tree-read-access'
import { manageableTree, type TreeManagementError } from '@/core/use-cases/tree-management-access'

export type TreeSettings = TreeDetails & { readonly id: string }

type GetTreeSettingsDeps = { readonly trees: TreeReader }

/** The current details of a tree, for its owner to edit. */
export class GetTreeSettingsUseCase {
  constructor(private readonly deps: GetTreeSettingsDeps) {}

  async execute(input: TreeReadInput): Promise<Result<TreeSettings, TreeManagementError>> {
    const access = await manageableTree(this.deps.trees, input)
    if (!access.ok) return access
    const { tree } = access.value.listing
    return ok({ id: tree.id.value, ...tree.details })
  }
}
