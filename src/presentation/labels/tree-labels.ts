import type { TreeRole, TreeVisibility } from '@/core/entities/tree'

export const VISIBILITY_LABELS: Readonly<Record<TreeVisibility, string>> = {
  PRIVATE: 'Privé',
  SHARED: 'Partagé',
  PUBLIC: 'Public',
}

export const ROLE_LABELS: Readonly<Record<TreeRole, string>> = {
  OWNER: 'Propriétaire',
  EDITOR: 'Éditeur',
  VIEWER: 'Lecteur',
}

/** French agreement: singular for 0 and 1, plural from 2. */
export function memberCountLabel(count: number): string {
  return `${count} ${count > 1 ? 'membres' : 'membre'}`
}
