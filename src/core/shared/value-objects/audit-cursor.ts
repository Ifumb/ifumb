const SEPARATOR = '|'

/**
 * Where a page of the audit log stops: the timestamp and id of its last entry. Both are needed,
 * since several entries can share one timestamp. Its token is opaque and safe in a URL.
 */
export class AuditCursor {
  private constructor(
    readonly createdAt: Date,
    readonly id: string,
  ) {
    Object.freeze(this)
  }

  static of(createdAt: Date, id: string): AuditCursor {
    return new AuditCursor(createdAt, id)
  }

  /** The cursor a token stands for; null for any token this class did not produce. */
  static parse(token: string): AuditCursor | null {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const separatorIndex = decoded.indexOf(SEPARATOR)
    if (separatorIndex < 0) return null
    const createdAt = new Date(decoded.slice(0, separatorIndex))
    const id = decoded.slice(separatorIndex + 1)
    if (Number.isNaN(createdAt.getTime()) || id === '') return null
    return new AuditCursor(createdAt, id)
  }

  get token(): string {
    return Buffer.from(`${this.createdAt.toISOString()}${SEPARATOR}${this.id}`).toString(
      'base64url',
    )
  }
}
