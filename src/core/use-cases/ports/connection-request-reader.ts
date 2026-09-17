import 'server-only'
import type { CrossTreeConnectionRequest } from '@/core/entities/connection-request'

export type ConnectionRequestView = {
  readonly request: CrossTreeConnectionRequest
  readonly requesterTreeName: string
  readonly requesterMemberName: string | null
  readonly targetMemberName: string | null
}

/** Read side of cross-tree connection requests, for the target tree's owner. */
export interface ConnectionRequestReader {
  listPendingForTree(targetTreeId: string): Promise<readonly ConnectionRequestView[]>
  findById(id: string): Promise<CrossTreeConnectionRequest | null>
}
