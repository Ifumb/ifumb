import 'server-only'
import type { Clock } from '@/core/use-cases/ports/clock'

export class SystemClock implements Clock {
  now(): Date {
    return new Date()
  }
}
