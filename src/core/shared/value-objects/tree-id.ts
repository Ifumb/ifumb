import { DomainError } from '@/core/shared/errors/domain-error'

export class TreeId {
  private constructor(readonly value: string) {
    Object.freeze(this)
  }

  static fromString(value: string): TreeId {
    if (value.trim() === '') {
      throw new DomainError('TreeId cannot be blank')
    }
    return new TreeId(value)
  }
}
