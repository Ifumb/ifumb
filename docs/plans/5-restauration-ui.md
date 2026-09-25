# Restauration de l’interface et des parcours legacy

Plan validé par l’utilisateur le 24 septembre 2026. Le skill explicitement choisi est
`C:/Users/chermann-king/.codex/skills/nextjs-clean-architect/SKILL.md`.
L’accord couvre la restauration complète, sans nouvelle validation pour les choix
d’implémentation réversibles à l’intérieur de ce périmètre.

## Architecture et périmètre

Workflow : fix + refactor de présentation. Référence : code React legacy et captures fournies.
Les données, autorisations et mutations sont celles de Next.js ; aucun appel à NestJS.
Présentation → cas d’usage → entités ; infrastructure → ports des cas d’usage.
Prisma/PostgreSQL et les interfaces Repository restent en place. Aucun changement de schéma.

Conserver notamment Auth.js/sessionVersion, contrôles d’accès serveur, rate limiting,
garde des écritures, confidentialité des arbres et contacts, validation des propositions,
calculs de parenté corrigés et traitement sécurisé des photos.
Les routes directes restent disponibles ; les navigations dans l’application ouvrent les
modales/panneaux au-dessus du contexte courant. Aucun stockage de token dans localStorage.

## Lots et fichiers prévus

| Lot | Fichiers / artefacts | Clean Code et validation |
| --- | --- | --- |
| Référence | `tests/e2e/ui-parity.spec.ts`, ce plan | Régression de parcours écrite avant correction ; fixtures locales isolées, sans données privées |
| Socle | `src/app/layout.tsx`, `(app)/layout.tsx`, `(auth)/layout.tsx`, `globals.css` ; `presentation/views/site-header.tsx`, `account-nav.tsx` ; composants `navigation/`, `ui/` | Layouts composés, état client limité au menu/overlay ; props readonly ; E2E navigation, axe et captures |
| Dashboard | `(app)/dashboard/page.tsx`, `presentation/views/tree-list-view.tsx` | Cartes et états vides réutilisables ; E2E création, navigation et capture |
| Overlays | `src/app/@overlay/` (default, catch-all et routes interceptées), `presentation/components/navigation/route-overlay.tsx` | Réutiliser les pages et leurs actions autorisées ; dialog natif, Escape, focus rendu au déclencheur ; E2E fermeture, historique et accès direct |
| Espace arbre | `src/app/tree/[id]/page.tsx`, `layout.tsx`, `graph/page.tsx`, `graph/graph-view-content.tsx` ; vues espace arbre et composants `family-graph/` | Orchestration RSC via DI, séparation barre/sidebar/canevas ; graphe vide conservé ; E2E rôles, modes, branches, clavier et capture |
| Autres parcours | `app/page.tsx`, pages auth/explore ; vues membres/unions/collaboration/notifications et composants formulaires existants | Réutilisation des validations et erreurs ; états vide/chargement/erreur conservés ; E2E existants adaptés au parcours restauré |
| Validation | tests E2E concernés, configuration visuelle si nécessaire | Vérifier comportement, sécurité et visuel indépendamment ; ne pas supprimer les assertions métier |

Les fichiers effectivement modifiés sont consignés dans le diff Git ; chaque nouveau composant
reste spécifique à une responsabilité. Pas de copie de la page arbre monolithique legacy.
Pas de modification prévue de `core/` ou des repositories ; donc pas de nouveaux tests core.
Les régressions d’interaction sont testées en E2E avant correction, les captures après contrôle
visuel de la référence. Les fonctions de mapping modifiées conservent leurs tests unitaires.

## Matrice de parcours

| Famille | Restitution attendue |
| --- | --- |
| Accueil et authentification | Accueil centré ; cartes connexion/inscription/récupération ; erreurs annoncées |
| Mes arbres | Navbar compacte, titre terracotta, cartes cliquables, création en modale |
| Arbre vide ou rempli | Graphe principal pleine surface, fil d’Ariane, actions, sidebar membres |
| Membres | Sélection depuis graphe/sidebar ; fiche et édition dédiées comme dans le legacy ; création/photo/suppression contextuelles |
| Unions | Nœud union, panneau relations, création/édition/ajout d’enfant contextuels |
| Outils graphe | Centrage, filtres, pivot, parenté, ancêtres communs, branches distantes, minimap |
| Collaboration | Paramètres, invitations, collaborateurs, revue des propositions, demandes et suggestions en panneaux |
| Compte | Notifications contextuelles, mot de passe en modale, déconnexion serveur |
| Explorer | Arbres/membres, filtres et pagination ; confidentialité et recherche corrigées conservées |
| Journal / contact / invitation publique | Pages dédiées conformes à la famille visuelle et aux droits existants |
| Aide | Visites guidées contextualisées, rejouables, sans secrets dans le stockage navigateur |

## Contrats visuels et accessibilité

Palette IFUMB existante, fond ivoire, terracotta, vert forêt, gris neutres, cartes blanches,
navbar 56 px, contenu dashboard centré, espace arbre adapté à la hauteur disponible.
Tokens Tailwind v4 ; boutons primary/secondary/ghost et tailles compactes selon le contexte.
Contraste et focus améliorés par rapport au legacy conservés même si certains gris sont plus foncés.
Navigation et actions sémantiques ; libellés accessibles pour icônes ; modales nommées,
focus piégé nativement, Escape/fermeture/restauration ; erreurs de formulaires existantes conservées.
Vérifier desktop et mobile, arbre vide/rempli et rôles OWNER/EDITOR/VIEWER/anonyme.

## Performance, sécurité, compatibilité et livraison

Graphe chargé dynamiquement ; pas d’import Prisma côté client. Métadonnées existantes conservées.
Les pages publiques/privées gardent leur politique d’indexation et ne révèlent aucun nom interdit.
Les overlays réutilisent les contrôles serveur des pages et actions ; pas de nouvelle API externe.
Pas de changement d’environnement, de déploiement ou de base. Pas de publication automatique.
Commit prévu : `fix(ui): restore legacy visuals and navigation` (patch, sans changement manuel de version).

Validation : typecheck, lint, tests unitaires/couverture, build, audit de dépendances ; intégration
et E2E sur Postgres Docker jetable, jamais Supabase. Captures et contrôle clavier sur parcours
restaurés. Toute limitation réelle de vérification sera documentée, sans annoncer un gate réussi.

## État

- Diagnostic et accord : faits.
- Implémentation et contrôles locaux : terminés le 25 septembre 2026.
- Validation finale : 94 scénarios E2E globaux, puis 16 scénarios ciblés sur les derniers
  ajustements ; six comparaisons visuelles Windows réussies. Détails et limites dans le rapport.

Le [rapport de validation](../qa/restauration-ui.md), son manifeste exhaustif par fichier et ses
exceptions de lisibilité précisent les artefacts effectivement livrés et les preuves de test.
