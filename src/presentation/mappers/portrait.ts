import type { PersonReference } from '@/core/use-cases/member-views'
import { photoSource, type PhotoSourcePolicy } from '@/presentation/formatting/photo-source'

/** A member's picture: the photo when it may be shown, otherwise the initial of the first name. */
export type PortraitViewModel = {
  readonly src: string | null
  readonly initial: string
  readonly alt: string
}

export function toPortrait(
  person: Pick<PersonReference, 'firstName' | 'lastName'>,
  photoUrl: string | null,
  photos: PhotoSourcePolicy | null,
): PortraitViewModel {
  const name = [person.firstName, person.lastName].filter(Boolean).join(' ')
  return {
    src: photoSource(photoUrl, photos),
    initial: person.firstName.charAt(0).toLocaleUpperCase('fr'),
    alt: `Photo de ${name}`,
  }
}
