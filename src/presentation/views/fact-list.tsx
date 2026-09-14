import type { Fact } from '@/presentation/mappers/fact'

/** A description list: text labels and values, never colour alone. */
export function FactList({ facts }: Readonly<{ facts: readonly Fact[] }>) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
      {facts.map(({ term, detail }) => (
        <div key={term} className="contents">
          <dt className="font-medium">{term}</dt>
          <dd>{detail}</dd>
        </div>
      ))}
    </dl>
  )
}
