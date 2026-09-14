import { describe, expect, it } from 'vitest'
import { describeAuditDiff } from '@/core/entities/audit-change'
import { treeCreationDiff, treeRevisionDiff } from '@/core/entities/tree-audit'
import { aTree } from '@tests/support/tree-fixtures'

describe('tree audit diffs', () => {
  it('records a creation with the name, description and visibility after', () => {
    const tree = aTree({ name: 'Famille Diallo', description: null, visibility: 'PUBLIC' })

    expect(treeCreationDiff(tree)).toEqual({
      before: null,
      after: { name: 'Famille Diallo', description: null, visibility: 'PUBLIC' },
    })
  })

  it('records a revision with only the changed fields, before and after', () => {
    const diff = treeRevisionDiff([
      { field: 'name', before: 'Famille Diallo', after: 'Famille Diallo-Sow' },
      { field: 'description', before: 'Du Fouta', after: null },
    ])

    expect(diff).toEqual({
      before: { name: 'Famille Diallo', description: 'Du Fouta' },
      after: { name: 'Famille Diallo-Sow', description: null },
    })
    expect(describeAuditDiff(diff).map((change) => change.kind)).toEqual(['changed', 'changed'])
  })
})
