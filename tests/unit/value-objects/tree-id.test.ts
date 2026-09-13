import { describe, expect, it } from 'vitest'
import { DomainError } from '@/core/shared/errors/domain-error'
import { TreeId } from '@/core/shared/value-objects/tree-id'

describe('TreeId', () => {
  it('keeps the given identifier', () => {
    expect(TreeId.fromString('tree_01').value).toBe('tree_01')
  })

  it('rejects a blank identifier', () => {
    expect(() => TreeId.fromString(' ')).toThrow(DomainError)
  })

  it('cannot be mutated', () => {
    expect(Object.isFrozen(TreeId.fromString('tree_01'))).toBe(true)
  })
})
