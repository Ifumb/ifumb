import { describe, expect, it } from 'vitest'
import { CrossTreeConnectionRequest } from '@/core/entities/connection-request'

const NOW = new Date('2026-09-17T10:00:00Z')
const LATER = new Date('2026-09-18T10:00:00Z')
const EXPIRES_AT = new Date('2026-10-17T10:00:00Z')
const AFTER_EXPIRY = new Date('2026-11-01T10:00:00Z')

function aRequest() {
  return CrossTreeConnectionRequest.open({
    id: 'cxr_1',
    requesterTreeId: 'tree_diallo',
    requesterMemberId: 'mbr_awa',
    targetTreeId: 'tree_toure',
    targetMemberId: 'mbr_fatou',
    initiatedByUserId: 'usr_owner',
    expiresAt: EXPIRES_AT,
    now: NOW,
  })
}

describe('CrossTreeConnectionRequest', () => {
  it('starts PENDING', () => {
    expect(aRequest().status).toBe('PENDING')
  })

  it('approves once, from PENDING to APPROVED', () => {
    const approved = aRequest().approve({ resolvedByUserId: 'usr_target_owner', now: LATER })
    expect(
      approved.ok && [approved.value.status, approved.value.resolvedByUserId],
    ).toEqual(['APPROVED', 'usr_target_owner'])
  })

  it('refuses once, from PENDING to REFUSED', () => {
    const refused = aRequest().refuse({ resolvedByUserId: 'usr_target_owner', now: LATER })
    expect(refused.ok && refused.value.status).toBe('REFUSED')
  })

  it('refuses to approve a request already resolved', () => {
    const approved = aRequest().approve({ resolvedByUserId: 'usr_target_owner', now: LATER })
    const again = approved.ok && approved.value.approve({ resolvedByUserId: 'usr_target_owner', now: LATER })
    expect(again && !again.ok && again.error).toEqual({ kind: 'CONNECTION_REQUEST_ALREADY_RESOLVED' })
  })

  it('refuses to approve a request past its expiry, even if never swept first', () => {
    const approved = aRequest().approve({ resolvedByUserId: 'usr_target_owner', now: AFTER_EXPIRY })
    expect(!approved.ok && approved.error).toEqual({ kind: 'CONNECTION_REQUEST_EXPIRED' })
  })

  it('refuses to refuse a request past its expiry, even if never swept first', () => {
    const refused = aRequest().refuse({ resolvedByUserId: 'usr_target_owner', now: AFTER_EXPIRY })
    expect(!refused.ok && refused.error).toEqual({ kind: 'CONNECTION_REQUEST_EXPIRED' })
  })

  it('reports isExpired independently of resolving', () => {
    expect([aRequest().isExpired(LATER), aRequest().isExpired(AFTER_EXPIRY)]).toEqual([false, true])
  })
})
