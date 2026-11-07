import { DraftBanner, DraftMarker } from '@/presentation/components/legal/draft-marker'
import { Section, Table } from '@/presentation/components/legal/legal-layout'

const LICENSE_GROUPS = [
  {
    license: 'MIT',
    count: 54,
    examples: 'React, Next.js, Zod, React Flow (@xyflow/react), @dagrejs/dagre, Resend, driver.js',
  },
  {
    license: 'ISC',
    count: 14,
    examples: 'next-auth, @auth/core, la famille d3-* (d3-color, d3-drag, d3-selection…)',
  },
  {
    license: 'Apache-2.0',
    count: 8,
    examples: '@prisma/client, @prisma/adapter-pg, sharp, @swc/helpers',
  },
  { license: 'BSD-3-Clause', count: 3, examples: 'bcryptjs, source-map-js, d3-ease' },
  { license: '0BSD', count: 1, examples: 'tslib' },
  { license: 'MIT-0', count: 1, examples: 'postal-mime' },
  { license: 'Unlicense', count: 1, examples: 'fast-sha256' },
  {
    license: 'CC-BY-4.0',
    count: 1,
    examples: 'caniuse-lite (donnée de compilation, non distribuée)',
  },
] as const

// reason: chaque section reste groupee avec son contenu pour rester lisible comme un seul document.
export function CreditsView() {
  return (
    <article className="space-y-8">
      <h1 className="text-3xl font-bold">Crédits et licences tierces</h1>
      <DraftBanner />

      <Section title="Composants logiciels">
        <p>
          IFUMB est construit avec des composants open source. Inventaire des 84 dépendances de
          production, généré le 2026-11-07 (<code>pnpm licenses list</code>) : aucune licence
          copyleft forte (GPL/AGPL/SSPL/BUSL) ni non commerciale (CC-NC), aucune licence manquante.
        </p>
        <Table>
          <thead>
            <tr className="border-b border-gray-300">
              <th className="py-2 pr-4 font-semibold">Licence</th>
              <th className="py-2 pr-4 font-semibold">Composants</th>
              <th className="py-2 font-semibold">Exemples</th>
            </tr>
          </thead>
          <tbody>
            {LICENSE_GROUPS.map((row) => (
              <tr key={row.license} className="border-b border-gray-100 align-top">
                <td className="py-2 pr-4 font-mono text-xs">{row.license}</td>
                <td className="py-2 pr-4">{row.count}</td>
                <td className="py-2 text-gray-700">{row.examples}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <p>
          <DraftMarker kind="a-completer">
            automatiser la génération de cette liste depuis `pnpm licenses list --json` au moment du
            build, plutôt que de la maintenir à la main
          </DraftMarker>
          .
        </p>
      </Section>

      <Section title="Polices, icônes, images">
        <p>
          Icônes : lucide-react (ISC). Police éditoriale des titres : Georgia / Times New Roman —
          polices système, aucune distribution. Aucun autre média sous licence Creative Commons
          identifié dans le dépôt.
        </p>
      </Section>

      <Section title="Mentions et réserves">
        <p>
          © <DraftMarker kind="a-completer">année</DraftMarker>{' '}
          <DraftMarker kind="a-completer">entité</DraftMarker>. Marque « IFUMB » :{' '}
          <DraftMarker kind="a-completer">statut</DraftMarker>.
        </p>
        <p>
          Réserve d’exploration de textes et de données (fouille de TDM / entraînement d’IA) : les
          arbres publics exposent du contenu en ligne, ce qui nécessite un procédé lisible par
          machine (<code>robots.txt</code>, <code>tdmrep.json</code>) pour être opposable.{' '}
          <DraftMarker kind="choix">à arbitrer avant l’indexation large d’/explore</DraftMarker>.
        </p>
      </Section>
    </article>
  )
}
