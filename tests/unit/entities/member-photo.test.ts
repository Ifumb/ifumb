import { describe, expect, it } from 'vitest'
import { memberPhotoDiff } from '@/core/entities/member-audit'
import {
  detectPhotoFormat,
  MEMBER_PHOTO_MAX_BYTES,
  photoUploadProblem,
} from '@/core/entities/member-photo'
import { aMember } from '@tests/support/family-fixtures'
import { GIF_BYTES, JPEG_BYTES, PNG_BYTES, SVG_BYTES, WEBP_BYTES } from '@tests/support/photo-bytes'

const sized = (length: number) => {
  const bytes = new Uint8Array(length)
  bytes.set(JPEG_BYTES)
  return bytes
}

describe('detectPhotoFormat', () => {
  it.each([
    [JPEG_BYTES, 'jpeg'],
    [PNG_BYTES, 'png'],
    [WEBP_BYTES, 'webp'],
    [SVG_BYTES, null],
    [GIF_BYTES, null],
    [new TextEncoder().encode('JPEG, promis'), null],
    [JPEG_BYTES.slice(0, 2), null],
    [new Uint8Array(), null],
  ])('reads the signature of %o as %s', (bytes, format) => {
    expect(detectPhotoFormat(bytes)).toBe(format)
  })
})

describe('photoUploadProblem', () => {
  it.each([
    [new Uint8Array(), 'PHOTO_EMPTY'],
    [sized(MEMBER_PHOTO_MAX_BYTES + 1), 'PHOTO_TOO_LARGE'],
    [SVG_BYTES, 'PHOTO_FORMAT_UNSUPPORTED'],
    [sized(MEMBER_PHOTO_MAX_BYTES), null],
    [PNG_BYTES, null],
  ])('finds a file of %i bytes to be %s', (bytes, problem) => {
    expect(photoUploadProblem(bytes)).toBe(problem)
  })

  it('allows five megabytes', () => {
    expect(MEMBER_PHOTO_MAX_BYTES).toBe(5 * 1024 * 1024)
  })
})

describe('member photo', () => {
  it('replaces the photo and says whether it changed, keeping every other fact', () => {
    const member = aMember({ photoUrl: 'https://photos.test/old.jpg', tribe: 'Peul' })

    const replaced = member.withPhoto('https://photos.test/new.webp')
    const same = member.withPhoto('https://photos.test/old.jpg')

    expect([replaced.changed, replaced.member.details.photoUrl]).toEqual([
      true,
      'https://photos.test/new.webp',
    ])
    expect([replaced.member.details.tribe, replaced.member.claimedById]).toEqual(['Peul', null])
    expect([same.changed, same.member]).toEqual([false, member])
  })

  it('records a photo change without the URLs being readable facts', () => {
    expect(memberPhotoDiff(null, 'https://photos.test/new.webp')).toEqual({
      before: { photoUrl: null },
      after: { photoUrl: 'https://photos.test/new.webp' },
    })
  })
})
