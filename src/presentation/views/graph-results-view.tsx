import Link from 'next/link'
import type { ReactNode } from 'react'
import type { GraphHref } from '@/presentation/graph/graph-view-urls'
import type { CommonAncestorsViewModel } from '@/presentation/mappers/common-ancestors-view-models'
import type { KinshipResultViewModel } from '@/presentation/mappers/kinship-view-models'
import { FactList } from '@/presentation/views/fact-list'

type ResultSectionProps = Readonly<{ id: string; title: ReactNode; children: ReactNode }>

function ResultSection({ id, title, children }: ResultSectionProps) {
  return (
    <section
      aria-labelledby={id}
      className="space-y-3 rounded-lg border-2 border-forest bg-white p-4"
    >
      <h2 id={id} className="text-xl font-bold">
        {title}
      </h2>
      {children}
    </section>
  )
}

type QuitProps = Readonly<{ quitHref: GraphHref }>

function QuitLink({ quitHref }: QuitProps) {
  return (
    <p>
      <Link href={quitHref}>Revenir au graphe complet</Link>
    </p>
  )
}

export function KinshipResultView({
  result,
  quitHref,
}: QuitProps & Readonly<{ result: KinshipResultViewModel }>) {
  return (
    <ResultSection id="kinship-result-title" title="Chemin de parenté">
      <p role="status" className="font-semibold">
        {result.statement}
      </p>
      {result.facts.length > 0 && <FactList facts={result.facts} />}
      {result.path.length > 0 && (
        <ol aria-label="Étapes du chemin" className="list-decimal space-y-1 pl-6">
          {result.path.map((person) => (
            <li key={person.href}>
              <Link href={person.href}>{person.name}</Link>
            </li>
          ))}
        </ol>
      )}
      <QuitLink quitHref={quitHref} />
    </ResultSection>
  )
}

export function CommonAncestorsResultView({
  result,
  quitHref,
}: QuitProps & Readonly<{ result: CommonAncestorsViewModel }>) {
  return (
    <ResultSection id="ancestors-result-title" title="Ancêtres communs">
      <p role="status" className="font-semibold">
        {result.statement}
      </p>
      {result.ancestors.length > 0 && (
        <ul className="space-y-2">
          {result.ancestors.map((ancestor) => (
            <li key={ancestor.href}>
              <Link href={ancestor.href}>{ancestor.name}</Link>
              <span className="block text-sm text-earth-bark">{ancestor.distances}</span>
            </li>
          ))}
        </ul>
      )}
      <QuitLink quitHref={quitHref} />
    </ResultSection>
  )
}

