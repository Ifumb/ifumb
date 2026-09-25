import { Icon } from '@/presentation/components/ui/icon'
import Form from 'next/form'
import type { ReactNode } from 'react'
import { Button } from '@/presentation/components/ui/button'
import { LabelledSelect } from '@/presentation/components/ui/labelled-select'
import type { GraphTool, GraphToolsViewModel } from '@/presentation/mappers/graph-tools-view-models'
import { GRAPH_VIEW_PARAMS as P } from '@/presentation/schemas/graph-view-schema'

type ToolsProps = Readonly<{ tools: GraphToolsViewModel }>

const TOOL_TITLES: Readonly<Record<GraphTool, string>> = {
  lineage: 'Descendance',
  kinship: 'Chemin de parenté',
  ancestors: 'Ancêtres communs',
}

/** The graph tools as plain GET forms: their result is a URL, readable and shareable. */
export function GraphToolsView({ tools }: ToolsProps) {
  return (
    <div className="graph-mode-tools">
      <ToolSection tool="lineage" tools={tools}>
        <LineageForm tools={tools} />
      </ToolSection>
      <ToolSection tool="kinship" tools={tools}>
        <PairForm tool="kinship" tools={tools} submitLabel="Calculer le chemin" />
      </ToolSection>
      <ToolSection tool="ancestors" tools={tools}>
        <PairForm tool="ancestors" tools={tools} submitLabel="Chercher les ancêtres communs" />
      </ToolSection>
    </div>
  )
}

type ToolSectionProps = ToolsProps & Readonly<{ tool: GraphTool; children: ReactNode }>

function ToolSection({ tool, tools, children }: ToolSectionProps) {
  return (
    <details
      open={tools.active === tool}
      className="rounded-lg border border-earth-sand bg-white p-3"
    >
      <summary
        id={`tour-btn-${tool}`}
        aria-label={TOOL_TITLES[tool]}
        className="flex cursor-pointer items-center gap-1 font-semibold"
      >
        <Icon name={tool === 'ancestors' ? 'people' : tool === 'lineage' ? 'lineage' : 'branch'} />
        {tool === 'kinship' ? 'Chemin' : tool === 'ancestors' ? 'Ancêtres' : 'Descendance'}
      </summary>
      {children}
    </details>
  )
}

// reason: le JSX garde ensemble la structure sémantique, ses libellés et les états de ce composant.
function LineageForm({ tools }: ToolsProps) {
  const errorId = problemIdFor(tools, 'lineage')
  return (
    <Form action={tools.action} className="mt-3 flex flex-wrap items-end gap-3">
      <input type="hidden" name={P.view} value="lineage" />
      <LabelledSelect
        id="lineage-member"
        name={P.member}
        label="Membre"
        placeholder="Choisir un membre"
        options={tools.people}
        defaultValue={tools.selected.member}
        describedBy={errorId}
      />
      <Button type="submit" variant="secondary">
        Voir la descendance
      </Button>
      <ProblemMessage tools={tools} tool="lineage" />
    </Form>
  )
}

type PairFormProps = ToolsProps &
  Readonly<{ tool: Exclude<GraphTool, 'lineage'>; submitLabel: string }>

function PairForm({ tool, tools, submitLabel }: PairFormProps) {
  return (
    <Form action={tools.action} className="mt-3 flex flex-wrap items-end gap-3">
      <input type="hidden" name={P.view} value={tool} />
      <PairSelects tool={tool} tools={tools} />
      <Button type="submit" variant="secondary">
        {submitLabel}
      </Button>
      <ProblemMessage tools={tools} tool={tool} />
    </Form>
  )
}

const PAIR_FIELDS = [
  { key: 'first', name: P.first, label: 'Membre A' },
  { key: 'second', name: P.second, label: 'Membre B' },
] as const

function PairSelects({ tool, tools }: Omit<PairFormProps, 'submitLabel'>) {
  const selected = tools.active === tool ? tools.selected : {}
  const describedBy = problemIdFor(tools, tool)
  return PAIR_FIELDS.map(({ key, name, label }) => (
    <LabelledSelect
      key={key}
      id={`${tool}-${key}`}
      name={name}
      label={label}
      placeholder="Choisir un membre"
      options={tools.people}
      describedBy={describedBy}
      defaultValue={selected[key]}
    />
  ))
}

function problemIdFor(tools: GraphToolsViewModel, tool: GraphTool): string | undefined {
  return tools.problem?.tool === tool ? `${tool}-problem` : undefined
}

function ProblemMessage({ tools, tool }: ToolsProps & Readonly<{ tool: GraphTool }>) {
  if (tools.problem?.tool !== tool) return null
  return (
    <p id={`${tool}-problem`} role="alert" className="w-full font-semibold text-brand-dark">
      {tools.problem.message}
    </p>
  )
}
