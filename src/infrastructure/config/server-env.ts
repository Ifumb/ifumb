import 'server-only'

/** Reads a required server-side variable at the moment it is needed, failing with its name. */
export function requireServerEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Environment variable ${name} is not set.`)
  }
  return value
}
