import 'server-only'
import { AddUnionChildUseCase } from '@/core/use-cases/add-union-child'
import { CreateUnionUseCase } from '@/core/use-cases/create-union'
import { DeleteUnionUseCase } from '@/core/use-cases/delete-union'
import { GetUnionUseCase } from '@/core/use-cases/get-union'
import { GetUnionFormUseCase } from '@/core/use-cases/get-union-form'
import { RemoveUnionChildUseCase } from '@/core/use-cases/remove-union-child'
import { UpdateUnionUseCase } from '@/core/use-cases/update-union'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { PhotoStorage } from '@/core/use-cases/ports/photo-storage'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'
import type { RecordProposalDeps } from '@/core/use-cases/proposal-recording'
import type { FamilyDeps } from '@/core/use-cases/union-write-access'
import { lazy } from '@/infrastructure/di/lazy'

export type TreeContentWriteDeps = FamilyDeps &
  RecordProposalDeps & {
    readonly unitOfWork: UnitOfWork
    readonly ids: IdGenerator
    readonly clock: Clock
    /** Deleting a member also deletes its photo file, when a storage is configured. */
    readonly storage: PhotoStorage | null
  }

/**
 * The union use cases, each built lazily like the rest of the container.
 * reason: kept apart from `container.ts` so that it stays under the size limit.
 */
export function unionUseCases(deps: () => TreeContentWriteDeps) {
  return {
    getUnion: lazy(() => new GetUnionUseCase(deps())),
    getUnionForm: lazy(() => new GetUnionFormUseCase(deps())),
    createUnion: lazy(() => new CreateUnionUseCase(deps())),
    updateUnion: lazy(() => new UpdateUnionUseCase(deps())),
    deleteUnion: lazy(() => new DeleteUnionUseCase(deps())),
    addUnionChild: lazy(() => new AddUnionChildUseCase(deps())),
    removeUnionChild: lazy(() => new RemoveUnionChildUseCase(deps())),
  }
}
