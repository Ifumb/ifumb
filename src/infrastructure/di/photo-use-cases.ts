import 'server-only'
import { ChangeMemberPhotoUseCase } from '@/core/use-cases/change-member-photo'
import { GetMemberPhotoFormUseCase } from '@/core/use-cases/get-member-photo-form'
import type { MemberPhotoDeps } from '@/core/use-cases/member-photo-deps'
import type { PhotoStorage } from '@/core/use-cases/ports/photo-storage'
import { RemoveMemberPhotoUseCase } from '@/core/use-cases/remove-member-photo'
import { businessWritesEnabled } from '@/infrastructure/config/business-writes'
import { lazy } from '@/infrastructure/di/lazy'
import { SupabasePhotoStorage } from '@/infrastructure/storage/supabase-photo-storage'

/**
 * The photo storage of this deployment; null when the Supabase project URL or its service role key
 * is missing, in which case photos can be neither added nor removed.
 */
export const configuredPhotoStorage = lazy((): PhotoStorage | null => {
  const projectUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!projectUrl || !serviceRoleKey || !URL.canParse(projectUrl)) return null
  return new SupabasePhotoStorage({
    projectUrl,
    serviceRoleKey,
    writesEnabled: businessWritesEnabled(),
  })
})

/** The member photo use cases, each built lazily like the rest of the container. */
export function photoUseCases(deps: () => MemberPhotoDeps) {
  return {
    changeMemberPhoto: lazy(() => new ChangeMemberPhotoUseCase(deps())),
    removeMemberPhoto: lazy(() => new RemoveMemberPhotoUseCase(deps())),
    getMemberPhotoForm: lazy(() => new GetMemberPhotoFormUseCase(deps())),
  }
}
