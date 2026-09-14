import { describe, expect, it } from 'vitest'
import type { LineageView } from '@/core/use-cases/family-graph-views'
import type { GenderedPerson, KinshipResult } from '@/core/use-cases/kinship-views'
import { toCommonAncestorsViewModel } from '@/presentation/mappers/common-ancestors-view-models'
import { toGraphToolsViewModel } from '@/presentation/mappers/graph-tools-view-models'
import { toKinshipResultViewModel } from '@/presentation/mappers/kinship-view-models'
import {
  relativeGenerationLabel,
  toLineageBannerViewModel,
} from '@/presentation/mappers/lineage-view-models'

const person = (id: string, firstName: string, gender: GenderedPerson['gender'] = null) => ({
  id,
  firstName,
  lastName: 'Diallo',
  gender,
})

const awa = person('awa', 'Awa', 'FEMALE')
const fatou = person('fatou', 'Fatou', 'FEMALE')
const ibrahima = person('ibrahima', 'Ibrahima', 'MALE')

describe('toKinshipResultViewModel', () => {
  const result: KinshipResult = {
    first: awa,
    second: ibrahima,
    relation: { kind: 'blood', ups: 0, downs: 2, fullSiblings: false, branch: null },
    path: [awa, fatou, ibrahima],
    unionIds: ['u1', 'u2'],
  }

  it('states the relation, its degree and the path', () => {
    const viewModel = toKinshipResultViewModel('t', result)

    expect(viewModel.statement).toBe('Pour Awa Diallo, Ibrahima Diallo est : petit-fils.')
    expect(viewModel.facts).toEqual([{ term: 'Degré', detail: '2 degrés' }])
    expect(viewModel.path.map((step) => step.href)).toEqual([
      '/tree/t/member/awa',
      '/tree/t/member/fatou',
      '/tree/t/member/ibrahima',
    ])
  })

  it('puts forward the people and unions of the path', () => {
    expect(toKinshipResultViewModel('t', result).emphasis).toEqual([
      'member_awa',
      'member_fatou',
      'member_ibrahima',
      'union_u1',
      'union_u2',
    ])
  })

  it('names the branch of a relation going up first', () => {
    const relation = {
      kind: 'blood',
      ups: 1,
      downs: 0,
      fullSiblings: false,
      branch: 'maternal',
    } as const

    expect(toKinshipResultViewModel('t', { ...result, relation }).facts).toContainEqual({
      term: 'Branche',
      detail: 'branche maternelle',
    })
  })

  it('says when no relation links the two members, and puts both forward', () => {
    const viewModel = toKinshipResultViewModel('t', {
      ...result,
      relation: null,
      path: [],
      unionIds: [],
    })

    expect(viewModel).toEqual({
      statement: 'Aucun lien de parenté trouvé entre Awa Diallo et Ibrahima Diallo.',
      facts: [],
      path: [],
      emphasis: ['member_awa', 'member_ibrahima'],
    })
  })
})

describe('toCommonAncestorsViewModel', () => {
  const ancestor = { person: awa, distanceFromFirst: 1, distanceFromSecond: 2 }

  it('lists each ancestor with its distances from both members', () => {
    const viewModel = toCommonAncestorsViewModel('t', {
      first: fatou,
      second: ibrahima,
      ancestors: [ancestor],
    })

    expect(viewModel.statement).toBe('1 ancêtre commun à Fatou Diallo et Ibrahima Diallo.')
    expect(viewModel.ancestors).toEqual([
      {
        href: '/tree/t/member/awa',
        name: 'Awa Diallo',
        distances: '1 génération depuis Fatou Diallo · 2 générations depuis Ibrahima Diallo',
      },
    ])
    expect(viewModel.emphasis).toEqual(['member_fatou', 'member_ibrahima', 'member_awa'])
  })

  it('counts several ancestors, and says when there is none', () => {
    const several = toCommonAncestorsViewModel('t', {
      first: fatou,
      second: ibrahima,
      ancestors: [ancestor, { ...ancestor, person: person('moussa', 'Moussa') }],
    })
    const none = toCommonAncestorsViewModel('t', { first: fatou, second: ibrahima, ancestors: [] })

    expect([several.statement, none.statement]).toEqual([
      '2 ancêtres communs à Fatou Diallo et Ibrahima Diallo.',
      'Aucun ancêtre commun trouvé entre Fatou Diallo et Ibrahima Diallo.',
    ])
  })
})

describe('toLineageBannerViewModel', () => {
  const lineage: LineageView = {
    pivot: { id: 'fatou', firstName: 'Fatou', lastName: 'Diallo' },
    ancestors: 1,
    descendants: 4,
    hasDescendants: true,
    deepestDescendantShown: 2,
  }
  const href = (up: number, down: number) =>
    `/tree/t/graph?view=lineage&member=fatou&up=${up}&down=${down}`

  it('offers to widen or narrow the generations shown', () => {
    const banner = toLineageBannerViewModel('t', lineage)

    expect(banner.rangeLabel).toBe('Générations affichées : de −1 à +4.')
    expect(banner.actions.map((action) => action.href)).toEqual([
      href(2, 4),
      href(1, 5),
      href(1, 1),
    ])
    expect([banner.noDescendantsMessage, banner.quitHref]).toEqual([null, '/tree/t/graph'])
  })

  it('offers no action that would change nothing', () => {
    const banner = toLineageBannerViewModel('t', {
      ...lineage,
      ancestors: 20,
      descendants: 0,
      hasDescendants: false,
      deepestDescendantShown: 0,
    })

    expect(banner.actions.map((action) => action.href)).toEqual([null, href(20, 1), null])
    expect(banner.noDescendantsMessage).toBe(
      'Fatou Diallo n’a pas de descendant enregistré dans cet arbre.',
    )
  })
})

describe('relativeGenerationLabel', () => {
  it.each([
    [0, true, 'Pivot'],
    [0, false, '0'],
    [2, false, '+2'],
    [-1, false, '−1'],
    [null, false, null],
  ])('labels %s (pivot: %s) as %s', (relative, isPivot, label) => {
    expect(relativeGenerationLabel(relative, isPivot)).toBe(label)
  })
})

describe('toGraphToolsViewModel', () => {
  const people = [awa, fatou]

  it('lists every member and starts with no tool open', () => {
    expect(toGraphToolsViewModel('t', people, { kind: 'overview' })).toEqual({
      action: '/tree/t/graph',
      people: [
        { value: 'awa', label: 'Awa Diallo' },
        { value: 'fatou', label: 'Fatou Diallo' },
      ],
      active: null,
      selected: {},
      problem: null,
    })
  })

  it('opens the active tool with its members selected', () => {
    const tools = toGraphToolsViewModel('t', people, {
      kind: 'ancestors',
      firstId: 'awa',
      secondId: 'fatou',
    })

    expect([tools.active, tools.selected]).toEqual(['ancestors', { first: 'awa', second: 'fatou' }])
  })

  it('keeps the pivot selected in a lineage view', () => {
    const tools = toGraphToolsViewModel('t', people, {
      kind: 'lineage',
      memberId: 'fatou',
      ancestors: 1,
      descendants: 4,
    })

    expect([tools.active, tools.selected]).toEqual(['lineage', { member: 'fatou' }])
  })

  it.each([
    ['lineage', 'MISSING_MEMBER', 'Choisissez un membre.'],
    ['kinship', 'MISSING_MEMBER', 'Choisissez deux membres.'],
    ['ancestors', 'SAME_MEMBER', 'Choisissez deux membres différents.'],
  ] as const)('explains an incomplete %s request (%s)', (view, problem, message) => {
    const tools = toGraphToolsViewModel('t', people, { kind: 'incomplete', view, problem })

    expect([tools.active, tools.problem]).toEqual([view, { tool: view, message }])
  })
})
