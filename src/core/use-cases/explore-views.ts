import 'server-only'
import type { PartialDate } from '@/core/shared/value-objects/partial-date'
import type { PersonName } from '@/core/use-cases/ports/tree-reader'

/** What a visitor narrows the public trees with; absent fields do not filter. */
export type PublicTreeCriteria = {
  /** Matches the tree name or its owner's first or last name. */
  readonly text?: string
  /** Kept trees have at least one member whose tribe contains it. */
  readonly tribe?: string
  /** Kept trees have at least one member whose ethnicity contains it. */
  readonly ethnicity?: string
}

export type PublicTreeSummary = {
  readonly id: string
  readonly name: string
  readonly description: string | null
  readonly owner: PersonName
  readonly memberCount: number
  readonly tribes: readonly string[]
  readonly ethnicities: readonly string[]
}

export type CulturalFacets = {
  readonly tribes: readonly string[]
  readonly ethnicities: readonly string[]
}

/** Raw cultural fields of the members of every public tree, before they are split. */
export type RawCulturalValues = {
  readonly tribes: readonly (string | null)[]
  readonly ethnicities: readonly (string | null)[]
}

export type PublicMemberSummary = {
  readonly id: string
  readonly firstName: string
  readonly lastName: string | null
  readonly birthDate: PartialDate | null
  readonly birthPlace: string | null
  readonly tribes: readonly string[]
  readonly ethnicities: readonly string[]
  readonly clan: string | null
  readonly originRegion: string | null
  readonly tree: { readonly id: string; readonly name: string }
}
