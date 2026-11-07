import type { ReactNode } from 'react'

// reason: les pages legales partagent les memes blocs de mise en page, sans logique metier.
export function Section({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  )
}

export function Dl({ children }: Readonly<{ children: ReactNode }>) {
  return <dl className="space-y-2">{children}</dl>
}

export function Row({ term, children }: Readonly<{ term: string; children: ReactNode }>) {
  return (
    <div className="grid gap-1 sm:grid-cols-[minmax(0,14rem)_1fr]">
      <dt className="font-medium text-gray-700">{term}</dt>
      <dd>{children}</dd>
    </div>
  )
}

export function Table({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  )
}
