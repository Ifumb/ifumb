import 'server-only'
import type { MemberReadDeps } from '@/core/use-cases/member-write-access'
import type { Clock } from '@/core/use-cases/ports/clock'
import type { IdGenerator } from '@/core/use-cases/ports/id-generator'
import type { PhotoProcessor } from '@/core/use-cases/ports/photo-processor'
import type { PhotoStorage } from '@/core/use-cases/ports/photo-storage'
import type { UnitOfWork } from '@/core/use-cases/ports/unit-of-work'

/** What the photo use cases depend on; the storage is null where none is configured. */
export type MemberPhotoDeps = MemberReadDeps & {
  readonly unitOfWork: UnitOfWork
  readonly ids: IdGenerator
  readonly clock: Clock
  readonly photos: PhotoProcessor
  readonly storage: PhotoStorage | null
}
