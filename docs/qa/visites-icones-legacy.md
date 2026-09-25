# Visites guidées et icônes : restitution du legacy

Références : captures fournies dans `../docs/screenshots`, `useTour.ts`, définitions des
tours et `styles/driver.css` du legacy. Plan : [6-visites-icones-legacy](../plans/6-visites-icones-legacy.md).

## Causes et correction

La restauration précédente utilisait un dialog fixé en bas à droite et un contour orange.
Le legacy utilise driver.js : découpe éclairée dans le voile, bulle attachée à la cible,
flèche, thème ivoire/or et boutons rouges. Les SVG simplifiés ne provenaient pas de Lucide.

- Driver.js **1.4.0**, comme le legacy, est chargé dynamiquement au démarrage du guide.
- Les textes, ordre des étapes, côtés et alignements du legacy sont repris. Le moteur
  ajuste la position si la place disponible est insuffisante.
- Les visites dashboard, arbre vide, arbre peuplé et inter-arbres sont distinguées.
- « Membre étranger » attend le chargement de la branche autorisée. Une erreur laisse
  une explication et un bouton Réessayer ; la fermeture annule l’attente.
- La cible est suivie pendant les transformations de React Flow pour éviter un éclairage
  décalé après extension de la branche. Ce suivi s’arrête avec la visite.
- Lucide React **1.48.0** (compatible React 19) remplace les SVG dessinés à la main :
  navigation, commandes du graphe et unions. Les icônes respectent les fonctions du legacy
  (GitMerge, GitBranch, GitFork, Network, Heart, Users, Dna, ZoomIn/Out, etc.).
- Les contrôles React Flow n’imposent plus un remplissage noir aux icônes Lucide.

Le focus est rendu au bouton d’aide, Escape et les commandes clavier sont conservés,
le bouton de fermeture est nommé en français et la réduction des mouvements est respectée.
Les textes secondaires sont légèrement plus contrastés que le legacy. L’attribut
`aria-expanded` ajouté par driver.js aux conteneurs non interactifs est retiré.

Les permissions, Server Actions, cas d’usage, entités, repositories et migrations restent
inchangés. Les données des bulles sont statiques ; aucun HTML utilisateur n’est injecté.
Aucun accès supplémentaire à une branche n’est créé par le guide.

## Validation

| Contrôle | Résultat |
| --- | --- |
| Régression avant correction | Échec reproduit : bulle à 374 px sous la cible au lieu de moins de 35 px |
| TypeScript | Réussi |
| ESLint | Réussi sans avertissement après correction du cycle de vie |
| Tests unitaires | 111 fichiers, 887 tests réussis |
| Couverture core | lignes 98,22 %, branches 92,89 % |
| Audit des dépendances | Aucune vulnérabilité connue |
| Build de production | Réussi |
| Parcours élargis | 21 tests réussis : tours, UI, graphe, branches et navigation |
| Derniers ajustements de positionnement/icônes | 12 tests réussis sur le build final (2,3 min) |
| Comparaison stricte des captures | 12 tests réussis sans actualisation des références (1,2 min), 12 captures comparées |

Les tests utilisent exclusivement PostgreSQL Docker jetable (`55432`) et le stockage photo
simulé. Ils ne modifient ni les données Supabase ni la copie locale du legacy (`55433`).
La passe de développement a détecté l’attribut ARIA invalide ; la revue visuelle a détecté
le déplacement de la cible pendant le recalcul du graphe. Des assertions couvrent ces cas.
La configuration de test ne définit pas `RESEND_FROM` : le parcours invitation journalise
donc un avertissement d’envoi. Un flux Next.js fermé prématurément a également été journalisé
pendant ce parcours, sans échec des assertions ; aucun envoi réel d’e-mail n’est validé ici.

Six nouvelles captures de visites sont conservées dans `tests/e2e/guided-tours.spec.ts-snapshots`.
Les six captures UI existantes sont actualisées pour Lucide. Les références sont produites
en mode production sous Chromium/Windows, sans indicateur Next.js de développement.
Elles sont comparées au thème et à l’ancrage des exemples fournis ; les données et dimensions
des exemples diffèrent, ce n’est donc pas une égalité pixel à pixel avec les images du legacy.

Pour revoir les guides : bouton **? / Rejouer la visite guidée** du dashboard ou du graphe.
Les préférences « déjà vu » existantes sont conservées.

## Checklist et exceptions

Le plan contient la responsabilité et la validation de chaque fichier. Tous les fichiers
source modifiés restent sous 200 lignes. Pas de nouveau `any`, désactivation ESLint ou
dépendance du core vers l’interface. Les exceptions suivantes ont un commentaire `reason:` :

| Fichier | Fonction | Justification |
| --- | --- | --- |
| `family-graph.tsx` | FamilyGraphCanvas, GraphCanvas | Garder la composition du canevas et de ses contrôles cohérente |
| `graph-interaction-controls.tsx` | GraphInteractionControls | Boutons avec leurs noms accessibles, états et actions |
| `member-node.tsx` | MemberNode | Badges et commandes se déplacent avec leur nœud |
| `union-node.tsx` | UnionNode | Garder ensemble les variantes locale et étrangère accessibles |
| `guided-tour.tsx` | GuidedTour | Cycle de vie et annulation de l’import dynamique |
| `graph-tools-view.tsx` | LineageForm | Structure sémantique du formulaire |
| `tree-workspace-header.tsx` | TreeWorkspaceHeader, TreeGraphActions | Composition des actions et de leurs permissions |
| `tour-driver.ts` | startTour | Configuration du moteur comparable à celle du legacy |
| `tour-foreign-step.ts` | showForeignTourStep | Gestion cohérente du chargement, succès, annulation et erreur |

Les imports CSS et les surcharges hors layer sont justifiés : les feuilles tierces sont
non stratifiées. Certains textes statiques/classes dépassent 120 caractères pour rester
recherchables d’un bloc. Aucune restructuration des couches métier n’est nécessaire.

Commit proposé : `fix(ui): match legacy guided tours and use lucide icons` — **patch**,
sans modification manuelle de version. Aucun commit ni déploiement effectué.
