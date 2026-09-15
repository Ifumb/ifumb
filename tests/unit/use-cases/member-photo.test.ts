import { beforeEach, describe, expect, it } from 'vitest'
import { ChangeMemberPhotoUseCase } from '@/core/use-cases/change-member-photo'
import { DeleteMemberUseCase } from '@/core/use-cases/delete-member'
import { GetMemberPhotoFormUseCase } from '@/core/use-cases/get-member-photo-form'
import { RemoveMemberPhotoUseCase } from '@/core/use-cases/remove-member-photo'
import { InMemoryPhotoStorage } from '@/infrastructure/storage/in-memory-photo-storage'
import {
  AWA_PHOTO_URL,
  CLAIMER_ID,
  MEMBER_WRITES_NOW,
  memberWriteWorld,
} from '@tests/support/member-write-world'
import { JPEG_BYTES, SVG_BYTES } from '@tests/support/photo-bytes'
import { EDITOR_ID, OWNER_ID, STRANGER_ID } from '@tests/support/tree-fixtures'

const NEW_PHOTO_URL = `${InMemoryPhotoStorage.PUBLIC_BASE}tree_diallo/mbr_awa-usr_1.webp`

describe('member photos', () => {
  let world: ReturnType<typeof memberWriteWorld>

  beforeEach(() => {
    world = memberWriteWorld()
  })

  const target = (viewerId = OWNER_ID, memberId = 'mbr_awa') => ({
    treeId: 'tree_diallo',
    memberId,
    viewerId,
  })

  describe('ChangeMemberPhotoUseCase', () => {
    const change = (photo = JPEG_BYTES, viewerId = OWNER_ID, memberId = 'mbr_awa') =>
      new ChangeMemberPhotoUseCase(world.deps()).execute({ ...target(viewerId, memberId), photo })

    it('stores the re-encoded photo, then its URL and history entry, then drops the old one', async () => {
      expect(await change()).toEqual({ ok: true, value: { photoUrl: NEW_PHOTO_URL } })
      expect(world.photos.received).toEqual([JPEG_BYTES])
      expect(world.storage.saved).toEqual([
        { path: 'tree_diallo/mbr_awa-usr_1.webp', contentType: 'image/webp' },
      ])
      expect(world.unitOfWork.updatedPhotos).toEqual([
        { memberId: 'mbr_awa', photoUrl: NEW_PHOTO_URL },
      ])
      expect(world.unitOfWork.auditRecords).toEqual([
        {
          id: 'usr_2',
          treeId: 'tree_diallo',
          authorId: OWNER_ID,
          action: 'MEMBER_UPDATED',
          targetType: 'MEMBER',
          targetId: 'mbr_awa',
          diff: { before: { photoUrl: AWA_PHOTO_URL }, after: { photoUrl: NEW_PHOTO_URL } },
          createdAt: MEMBER_WRITES_NOW,
        },
      ])
      expect(world.storage.removed).toEqual([AWA_PHOTO_URL])
    })

    it('lets the account that claimed the member change its photo', async () => {
      expect((await change(JPEG_BYTES, CLAIMER_ID)).ok).toBe(true)
    })

    it('succeeds even when the old photo cannot be removed', async () => {
      world.storage.failRemovals()

      expect(await change()).toEqual({ ok: true, value: { photoUrl: NEW_PHOTO_URL } })
      expect(world.unitOfWork.updatedPhotos).toHaveLength(1)
    })

    it('removes the new photo again when its URL cannot be stored', async () => {
      world.unitOfWork.failNextAuditRecord()

      await expect(change()).rejects.toThrow()
      expect(world.unitOfWork.updatedPhotos).toEqual([])
      expect(world.storage.removed).toEqual([NEW_PHOTO_URL])
    })

    it.each([
      [SVG_BYTES, OWNER_ID, 'mbr_awa', 'PHOTO_FORMAT_UNSUPPORTED'],
      [new Uint8Array(), OWNER_ID, 'mbr_awa', 'PHOTO_EMPTY'],
      [JPEG_BYTES, EDITOR_ID, 'mbr_awa', 'MEMBER_EDIT_FORBIDDEN'],
      [JPEG_BYTES, STRANGER_ID, 'mbr_awa', 'ACCESS_DENIED'],
      [JPEG_BYTES, OWNER_ID, 'mbr_elsewhere', 'MEMBER_NOT_FOUND'],
    ])('refuses %o from %s on %s with %s', async (photo, viewerId, memberId, kind) => {
      expect(await change(photo, viewerId, memberId)).toEqual({ ok: false, error: { kind } })
      expect([world.storage.saved, world.unitOfWork.transactions]).toEqual([[], 0])
    })

    it('refuses a file the image processor cannot read', async () => {
      world.photos.refuseEverything()

      expect(await change()).toEqual({ ok: false, error: { kind: 'PHOTO_UNREADABLE' } })
      expect(world.storage.saved).toEqual([])
    })

    it('refuses every photo where no storage is configured', async () => {
      const result = await new ChangeMemberPhotoUseCase({ ...world.deps(), storage: null }).execute(
        { ...target(), photo: JPEG_BYTES },
      )

      expect(result).toEqual({ ok: false, error: { kind: 'PHOTO_STORAGE_UNAVAILABLE' } })
      expect(world.photos.received).toEqual([])
    })
  })

  describe('RemoveMemberPhotoUseCase', () => {
    const remove = (viewerId = OWNER_ID, memberId = 'mbr_awa') =>
      new RemoveMemberPhotoUseCase(world.deps()).execute(target(viewerId, memberId))

    it('clears the photo, records it, then removes the file', async () => {
      expect(await remove()).toEqual({ ok: true, value: { changed: true } })
      expect(world.unitOfWork.updatedPhotos).toEqual([{ memberId: 'mbr_awa', photoUrl: null }])
      expect(world.unitOfWork.auditRecords.map(({ diff }) => diff)).toEqual([
        { before: { photoUrl: AWA_PHOTO_URL }, after: { photoUrl: null } },
      ])
      expect(world.storage.removed).toEqual([AWA_PHOTO_URL])
    })

    it('writes nothing for a member without a photo', async () => {
      expect(await remove(OWNER_ID, 'mbr_moussa')).toEqual({ ok: true, value: { changed: false } })
      expect(world.unitOfWork.transactions).toBe(0)
    })

    it('refuses an editor with MEMBER_EDIT_FORBIDDEN', async () => {
      expect(await remove(EDITOR_ID)).toEqual({
        ok: false,
        error: { kind: 'MEMBER_EDIT_FORBIDDEN' },
      })
    })
  })

  describe('photos of deleted members', () => {
    it('removes the photo file once the member is deleted', async () => {
      await new DeleteMemberUseCase(world.deps()).execute(target())

      expect(world.unitOfWork.deletedMemberIds).toEqual(['mbr_awa'])
      expect(world.storage.removed).toEqual([AWA_PHOTO_URL])
    })

    it('keeps the photo file when the deletion fails', async () => {
      world.unitOfWork.failNextAuditRecord()

      await expect(new DeleteMemberUseCase(world.deps()).execute(target())).rejects.toThrow()
      expect(world.storage.removed).toEqual([])
    })
  })

  describe('GetMemberPhotoFormUseCase', () => {
    const form = (viewerId = OWNER_ID, storage: InMemoryPhotoStorage | null = world.storage) =>
      new GetMemberPhotoFormUseCase({ ...world, storage }).execute(target(viewerId))

    it('gives the current photo and whether photos can be stored here', async () => {
      expect(await form()).toEqual({
        ok: true,
        value: {
          tree: { id: 'tree_diallo', name: 'Famille Diallo' },
          member: { id: 'mbr_awa', firstName: 'Awa', lastName: 'Diallo', photoUrl: AWA_PHOTO_URL },
          storageAvailable: true,
        },
      })
      const withoutStorage = await form(OWNER_ID, null)
      expect(withoutStorage.ok && withoutStorage.value.storageAvailable).toBe(false)
    })

    it('refuses an editor with MEMBER_EDIT_FORBIDDEN', async () => {
      expect(await form(EDITOR_ID)).toEqual({ ok: false, error: { kind: 'MEMBER_EDIT_FORBIDDEN' } })
    })
  })
})
