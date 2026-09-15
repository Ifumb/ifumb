/** Memoizes a factory so each dependency is built once, on first use. */
export function lazy<T>(create: () => T): () => T {
  let instance: T | undefined
  return () => (instance ??= create())
}
