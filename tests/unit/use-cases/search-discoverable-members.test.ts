import { beforeEach, describe, expect, it } from 'vitest'
import { ContactRequest } from '@/core/entities/contact-request'
import { SearchDiscoverableMembersUseCase } from '@/core/use-cases/search-discoverable-members'
import { InMemoryContactRequestReader } from '@/infrastructure/persistence/in-memory/in-memory-contact-request-reader'
import { InMemoryDiscoverableMemberDirectory } from '@/infrastructure/persistence/in-memory/in-memory-discoverable-member-directory'

describe('SearchDiscoverableMembersUseCase', () => {
  let directory: InMemoryDiscoverableMemberDirectory
  let contactRequests: InMemoryContactRequestReader
  let search: SearchDiscoverableMembersUseCase

  beforeEach(() => {
    directory = new InMemoryDiscoverableMemberDirectory()
    directory.seed(
      { memberId: 'mbr_awa', firstName: 'Awa', lastName: 'Diallo', birthDate: null, ethnicities: ['Peul'], originRegion: null },
      { treeId: 'tree_diallo', ownerId: 'usr_owner', discoverable: true },
    )
    contactRequests = new InMemoryContactRequestReader()
    search = new SearchDiscoverableMembersUseCase({ directory, contactRequests })
  })

  it('searches nothing for a blank query', async () => {
    const result = await search.execute({ page: 1 })
    expect([result.query, result.members.items]).toEqual([null, []])
  })

  it('shows no contact status for an anonymous visitor', async () => {
    const result = await search.execute({ query: 'Awa', page: 1 })
    expect(result.members.items).toMatchObject([{ memberId: 'mbr_awa', contactStatus: null }])
  })

  it('shows the viewer’s own contact status for a member they already contacted', async () => {
    contactRequests.seed(
      ContactRequest.send({
        id: 'cr_1',
        treeId: 'tree_diallo',
        memberId: 'mbr_awa',
        requesterId: 'usr_visitor',
        message: null,
        now: new Date('2026-09-17T10:00:00Z'),
      }),
    )

    const result = await search.execute({ query: 'Awa', page: 1, viewerId: 'usr_visitor' })
    expect(result.members.items).toMatchObject([{ memberId: 'mbr_awa', contactStatus: 'PENDING' }])
  })
})
