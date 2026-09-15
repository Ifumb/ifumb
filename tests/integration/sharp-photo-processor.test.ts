import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { SharpPhotoProcessor } from '@/infrastructure/images/sharp-photo-processor'

const processor = new SharpPhotoProcessor()

const picture = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: { r: 180, g: 90, b: 40 } } })

async function normalized(bytes: Uint8Array) {
  const result = await processor.normalize(bytes)
  if (!result.ok) throw new Error('The photo was refused')
  return result.value
}

describe('SharpPhotoProcessor', () => {
  it('drops the EXIF block of a camera picture, GPS position included', async () => {
    const withGps = await picture(64, 48)
      .withExif({
        IFD0: { Make: 'Family camera' },
        IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '14/1 41/1 0/1' },
      })
      .jpeg()
      .toBuffer()
    expect((await sharp(withGps).metadata()).exif).toBeDefined()

    const photo = await normalized(withGps)
    const metadata = await sharp(photo.bytes).metadata()

    expect([photo.contentType, metadata.format]).toEqual(['image/webp', 'webp'])
    expect([metadata.exif, metadata.icc, metadata.xmp]).toEqual([undefined, undefined, undefined])
  })

  it('bounds the longest side to 1024 pixels, keeping the proportions', async () => {
    const large = await picture(3000, 1500).png().toBuffer()

    const { width, height } = await sharp((await normalized(large)).bytes).metadata()

    expect([width, height]).toEqual([1024, 512])
  })

  it('never enlarges a small picture', async () => {
    const small = await picture(200, 100).webp().toBuffer()

    const { width } = await sharp((await normalized(small)).bytes).metadata()

    expect(width).toBe(200)
  })

  it.each([
    [
      'an SVG drawing',
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9"/>'),
    ],
    ['a truncated JPEG', Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])],
    ['plain text', Buffer.from('not an image at all')],
  ])('refuses %s', async (_label, bytes) => {
    expect(await processor.normalize(bytes)).toEqual({
      ok: false,
      error: { kind: 'PHOTO_UNREADABLE' },
    })
  })

  it('refuses an image whose decoded size would be unreasonable', async () => {
    const huge = await picture(10_000, 5_000).png({ compressionLevel: 9 }).toBuffer()

    expect((await processor.normalize(huge)).ok).toBe(false)
  })
})
