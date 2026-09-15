/** Largest photo file accepted, as in the legacy app. */
export const MEMBER_PHOTO_MAX_BYTES = 5 * 1024 * 1024

export type PhotoFormat = 'jpeg' | 'png' | 'webp'

export type PhotoUploadProblem = 'PHOTO_EMPTY' | 'PHOTO_TOO_LARGE' | 'PHOTO_FORMAT_UNSUPPORTED'

type Signature = { readonly offset: number; readonly bytes: readonly number[] }

const ascii = (text: string) => [...text].map((character) => character.charCodeAt(0))

/**
 * The first bytes each accepted format starts with.
 * reason: the declared type and the file name are chosen by the sender; only the content tells
 * what a file is. Vector and animated formats (SVG, GIF) are left out on purpose.
 */
const SIGNATURES: Readonly<Record<PhotoFormat, readonly Signature[]>> = {
  jpeg: [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  png: [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  webp: [
    { offset: 0, bytes: ascii('RIFF') },
    { offset: 8, bytes: ascii('WEBP') },
  ],
}

/** The format a file's content shows, whatever it claims to be; null when not accepted. */
export function detectPhotoFormat(bytes: Uint8Array): PhotoFormat | null {
  const formats = Object.keys(SIGNATURES) as PhotoFormat[]
  return formats.find((format) => SIGNATURES[format].every((part) => matches(bytes, part))) ?? null
}

/** What prevents a file from becoming a member photo, if anything. */
export function photoUploadProblem(bytes: Uint8Array): PhotoUploadProblem | null {
  if (bytes.length === 0) return 'PHOTO_EMPTY'
  if (bytes.length > MEMBER_PHOTO_MAX_BYTES) return 'PHOTO_TOO_LARGE'
  return detectPhotoFormat(bytes) ? null : 'PHOTO_FORMAT_UNSUPPORTED'
}

function matches(bytes: Uint8Array, { offset, bytes: expected }: Signature): boolean {
  return expected.every((byte, index) => bytes[offset + index] === byte)
}
