# Fidélité des visites guidées et icônes

Correctif demandé dans la continuité du plan de restauration déjà validé. Références :
captures `../docs/screenshots`, tours et thème driver.js du legacy. Aucun changement métier.

## Architecture et validation par fichier

Présentation uniquement ; dépendances vers les couches internes inchangées.
Prisma/PostgreSQL et les ports Repository sont conservés. Aucun contrat API, schéma,
secret, environnement de production ou parcours d’autorisation modifié.

| Fichier | Responsabilité, checklist et test |
| --- | --- |
| `package.json`, `pnpm-lock.yaml` | Driver.js 1.4.0 comme le legacy, Lucide compatible React 19, versions figées ; audit et build |
| `src/app/globals.css` | Import CSS du moteur et tokens de visite ; captures et contrastes |
| `src/presentation/styles/tours.css` | Thème ivoire/or, flèche, boutons rouges et dimensions legacy ; captures desktop/mobile, axe |
| `src/presentation/components/navigation/guided-tour.tsx` | Déclenchement/rejeu et cycle de vie client ; focus restauré, Escape, préférence locale ; E2E |
| `src/presentation/tours/tour-driver.ts` | Adaptateur driver.js, positionnement, libellés accessibles et mouvement réduit ; E2E ancrage/clavier |
| `src/presentation/tours/tour-foreign-step.ts` | Attente du rendu de la branche, annulation et erreur réessayable ; E2E succès/indisponibilité |
| `src/presentation/tours/track-tour-target.ts` | Repositionnement pendant les transformations React Flow, animation annulée à la fermeture ; E2E alignement sur la carte étrangère |
| `src/presentation/styles/workspace.css` | Empêcher React Flow de remplir les icônes Lucide ; assertion de style et captures |
| `src/presentation/tours/tour-steps.ts` | Étapes et alignements legacy, constantes readonly ; E2E ancrage et ordre |
| `src/presentation/components/family-graph/graph-guided-tour.tsx` | Sélection du guide selon les données déjà autorisées ; disponibilité des cibles ; E2E branche |
| `src/presentation/components/family-graph/family-graph.tsx` | Composition du guide et contrôles Lucide ; E2E graphe |
| `src/presentation/components/family-graph/member-node.tsx` | Marqueurs des cibles membre-pont/étranger ; droits inchangés ; E2E branche |
| `src/presentation/components/ui/icon.tsx` | Adaptateur typé avec imports Lucide nommés, SVG décoratifs ; build et contrôle visuel |
| `src/presentation/components/family-graph/union-node.tsx` | Icônes Lucide correspondant aux unions, noms accessibles conservés ; E2E |
| `src/presentation/components/family-graph/graph-interaction-controls.tsx` | Zoom/ajustement/verrouillage/rangement Lucide ; boutons nommés et clavier ; E2E |
| `src/presentation/views/graph-tools-view.tsx`, `tree-workspace-header.tsx` | GitBranch/GitFork/GitMerge/Network selon la fonction ; captures |
| `tests/e2e/guided-tours.spec.ts` | Régression d’ancrage écrite avant correction ; desktop, mobile, graphe et branche, focus/axe |
| `tests/e2e/support/fixtures.ts` | Neutraliser aussi la visite inter-arbres dans les tests métier ; E2E |
| `tests/e2e/ui-parity.spec.ts`, captures associées | Libellés de boutons restaurés, références revues après le passage à Lucide |
| Ce plan et `docs/qa/visites-icones-legacy.md` | Périmètre, résultats réels et éventuelles exceptions |

Pas de modification core : les tests de positionnement E2E sont pertinents ici. Première
exécution rouge avant correction ; ensuite lint, types, tests unitaires existants, audit,
build et E2E des tours/graphe/navigation. Vérification visuelle avant validation des références.

Driver.js est chargé dynamiquement au démarrage du guide. Aucun HTML issu des données
utilisateur dans les bulles : descriptions statiques. Retour du focus, libellés français,
clavier et réduction des mouvements conservés. Les métadonnées de route restent identiques.
Exceptions éventuelles de longueur JSX/cycle de vie : `reason:` et rapport de livraison.

Commit proposé : `fix(ui): match legacy guided tours and use lucide icons` — patch.
