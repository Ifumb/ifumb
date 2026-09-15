import { describe, expect, it } from 'vitest'
import { MEMBER_PHOTO_MAX_BYTES } from '@/core/entities/member-photo'
import { CHANGE_MEMBER_PHOTO_ERRORS } from '@/presentation/errors/member-photo-messages'
import { formatAuditValue } from '@/presentation/formatting/audit-value-format'
import { AUDIT_FIELD_LABELS } from '@/presentation/labels/audit-labels'
import { toPortrait } from '@/presentation/mappers/portrait'
import {
  memberPhotoFileSchema,
  memberPhotoIntentSchema,
} from '@/presentation/schemas/member-photo-schema'

const PHOTOS = {
  origin: 'https://abc.supabase.co',
  pathPrefix: '/storage/v1/object/public/member-photos/',
}
const IN_BUCKET = 'https://abc.supabase.co/storage/v1/object/public/member-photos/t/awa.webp'

const fileOf = (size: number) => new File([new Uint8Array(size)], 'awa.jpg', { type: 'image/jpeg' })

describe('member portrait', () => {
  it('shows a photo of the configured bucket, described by the member name', () => {
    expect(toPortrait({ firstName: 'awa', lastName: 'Diallo' }, IN_BUCKET, PHOTOS)).toEqual({
      src: IN_BUCKET,
      initial: 'A',
      alt: 'Photo de awa Diallo',
    })
  })

  it.each([
    ['a photo from elsewhere', 'https://tracker.test/pixel.gif', PHOTOS],
    ['no photo', null, PHOTOS],
    ['no configured bucket', IN_BUCKET, null],
  ])('falls back to the initial with %s', (_label, url, policy) => {
    expect(toPortrait({ firstName: 'Awa', lastName: null }, url, policy).src).toBeNull()
  })
})

describe('member photo form', () => {
  it('reads the pressed button, saving when it is unknown', () => {
    expect(memberPhotoIntentSchema.parse('remove')).toBe('remove')
    expect(memberPhotoIntentSchema.parse('explode')).toBe('save')
    expect(memberPhotoIntentSchema.parse(null)).toBe('save')
  })

  it.each([
    [null, 'Choisissez une photo'],
    ['awa.jpg', 'Choisissez une photo'],
    [fileOf(0), 'Choisissez une photo'],
    [fileOf(MEMBER_PHOTO_MAX_BYTES + 1), 'La photo ne doit pas dépasser 5 Mo'],
  ])('refuses %o with "%s"', (entry, message) => {
    const parsed = memberPhotoFileSchema.safeParse(entry)
    expect(parsed.success ? null : parsed.error.issues[0]?.message).toBe(message)
  })

  it('accepts a file of at most five megabytes', () => {
    expect(memberPhotoFileSchema.safeParse(fileOf(MEMBER_PHOTO_MAX_BYTES)).success).toBe(true)
  })

  it('places the refusals about the file on its field', () => {
    const { PHOTO_FORMAT_UNSUPPORTED, PHOTO_UNREADABLE, PHOTO_STORAGE_UNAVAILABLE } =
      CHANGE_MEMBER_PHOTO_ERRORS
    expect([PHOTO_FORMAT_UNSUPPORTED.field, PHOTO_UNREADABLE.field]).toEqual(['photo', 'photo'])
    expect(PHOTO_STORAGE_UNAVAILABLE.field).toBeUndefined()
  })
})

describe('photo changes in the history', () => {
  it('names the photo and never shows its address', () => {
    expect(AUDIT_FIELD_LABELS.photoUrl).toBe('Photo')
    expect(formatAuditValue(IN_BUCKET, 'photoUrl')).toBe('Enregistrée')
    expect(formatAuditValue(null, 'photoUrl')).toBe('Non renseigné')
  })
})
