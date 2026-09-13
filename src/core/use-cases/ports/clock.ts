import 'server-only'

/** Source of the current instant, injected so that time-dependent rules stay testable. */
export interface Clock {
  now(): Date
}
