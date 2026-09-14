import { DomainError } from '@/core/shared/errors/domain-error'

export class MemberId {
  private constructor(readonly value: string) {
    Object.freeze(this)
  }

  static fromString(value: string): MemberId {
    if (value.trim() === '') {
      throw new DomainError('MemberId cannot be blank')
    }
    return new MemberId(value)
  }
}
