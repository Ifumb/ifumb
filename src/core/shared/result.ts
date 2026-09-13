export type Ok<T> = { readonly ok: true; readonly value: T }

export type Err<E> = { readonly ok: false; readonly error: E }

/** Outcome of an operation that can fail in an expected, typed way. */
export type Result<T, E> = Ok<T> | Err<E>

/** Wraps a successful value. */
export function ok<T>(value: T): Ok<T> {
  return { ok: true, value }
}

/** Wraps an expected failure, typically `{ kind: '...' }`. */
export function err<E>(error: E): Err<E> {
  return { ok: false, error }
}
