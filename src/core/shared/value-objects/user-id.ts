import { DomainError } from '@/core/shared/errors/domain-error'

export class UserId {
  private constructor(readonly value: string) {
    Object.freeze(this)
  }

  static fromString(value: string): UserId {
    if (value.trim() === '') {
      throw new DomainError('UserId cannot be blank')
    }
    return new UserId(value)
  }
}
