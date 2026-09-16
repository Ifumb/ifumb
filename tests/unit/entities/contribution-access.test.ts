import { describe, expect, it } from 'vitest'
import { writeMode } from '@/core/entities/contribution-access'

describe('writeMode', () => {
  it('applies when the rule allows it, whatever the role', () => {
    expect(writeMode('OWNER', true)).toBe('apply')
    expect(writeMode('VIEWER', true)).toBe('apply')
  })

  it('has an editor propose when the rule refuses them', () => {
    expect(writeMode('EDITOR', false)).toBe('propose')
  })

  it('refuses anyone else the rule refuses', () => {
    expect(writeMode('VIEWER', false)).toBe('forbidden')
    expect(writeMode('OWNER', false)).toBe('forbidden')
  })
})
