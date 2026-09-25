# Fichiers de la restauration UI

Checklist par artefact du plan validé. Les chemins sont relatifs à la racine du dépôt.
Les fichiers déjà modifiés avant cette tâche (`.gitignore`, `package.json`, `playwright.smoke.config.ts`) restent préservés.
`CLAUDE.md` contient uniquement l’ajout de documentation généré par Next.js.

| Fichier | Clean Code et validation |
| --- | --- |
| [src/app/actions/member-actions.ts](../../src/app/actions/member-actions.ts) | Retour au graphe après création OWNER ; validation, permissions et propositions inchangées ; E2E rouge puis vert sur le retour et la modale EDITOR. |
| [src/app/actions/union-actions.ts](../../src/app/actions/union-actions.ts) | Retour au graphe après création OWNER ; contrôles de parents/cycles conservés ; E2E rouge puis vert sur création et ajout d’enfant. |
| [docs/qa/restauration-ui.md](restauration-ui.md) | Diagnostic, contrôles réels, limites de la comparaison Windows/Linux et procédure de reproduction. |
| [docs/qa/restauration-ui-fichiers.md](restauration-ui-fichiers.md) | Manifeste et checklist par fichier ; modifications préexistantes distinguées. |
| [docs/qa/restauration-ui-exceptions.md](restauration-ui-exceptions.md) | Exceptions de longueur justifiées dans le code ; inventaire des fonctions concernées. |
| [tests/e2e/support/ui-reference.ts](../../tests/e2e/support/ui-reference.ts) | Captures jointes sur toute plateforme ; comparaison stricte Windows et annotation explicite sur Linux. |
| [docs/plans/5-restauration-ui.md](../../docs/plans/5-restauration-ui.md) | Documentation du périmètre autorisé et des validations ; revue manuelle. |
| [playwright.ui.config.ts](../../playwright.ui.config.ts) | Configuration locale dérivée du socle de tests ; services de test explicitement isolés. |
| [src/app/(app)/dashboard/page.tsx](../../src/app/(app)/dashboard/page.tsx) | Composition RSC et DI existante, aucun accès Prisma direct ; métadonnées/contrôles préservés ; E2E parcours. |
| [src/app/(app)/layout.tsx](../../src/app/(app)/layout.tsx) | Composition RSC et DI existante, aucun accès Prisma direct ; métadonnées/contrôles préservés ; E2E parcours. |
| [src/app/(auth)/layout.tsx](../../src/app/(auth)/layout.tsx) | Composition RSC et DI existante, aucun accès Prisma direct ; métadonnées/contrôles préservés ; E2E parcours. |
| [src/app/@overlay/(.)account/password/page.tsx](../../src/app/@overlay/(.)account/password/page.tsx) | Route fine, page serveur réutilisée avec ses droits ; dialog natif ; E2E fermeture, historique, accès direct. |
| [src/app/@overlay/(.)notifications/page.tsx](../../src/app/@overlay/(.)notifications/page.tsx) | Route fine, page serveur réutilisée avec ses droits ; dialog natif ; E2E fermeture, historique, accès direct. |
| [src/app/@overlay/(.)tree/[id]/collaborators/[invitationId]/revoke/page.tsx](../../src/app/@overlay/(.)tree/[id]/collaborators/[invitationId]/revoke/page.tsx) | Route fine, page serveur réutilisée avec ses droits ; dialog natif ; E2E fermeture, historique, accès direct. |
| [src/app/@overlay/(.)tree/[id]/collaborators/page.tsx](../../src/app/@overlay/(.)tree/[id]/collaborators/page.tsx) | Route fine, page serveur réutilisée avec ses droits ; dialog natif ; E2E fermeture, historique, accès direct. |
| [src/app/@overlay/(.)tree/[id]/connection-requests/page.tsx](../../src/app/@overlay/(.)tree/[id]/connection-requests/page.tsx) | Route fine, page serveur réutilisée avec ses droits ; dialog natif ; E2E fermeture, historique, accès direct. |
| [src/app/@overlay/(.)tree/[id]/links/page.tsx](../../src/app/@overlay/(.)tree/[id]/links/page.tsx) | Route fine, page serveur réutilisée avec ses droits ; dialog natif ; E2E fermeture, historique, accès direct. |
| [src/app/@overlay/(.)tree/[id]/member/[memberId]/delete/page.tsx](../../src/app/@overlay/(.)tree/[id]/member/[memberId]/delete/page.tsx) | Route fine, page serveur réutilisée avec ses droits ; dialog natif ; E2E fermeture, historique, accès direct. |
| [src/app/@overlay/(.)tree/[id]/member/[memberId]/photo/page.tsx](../../src/app/@overlay/(.)tree/[id]/member/[memberId]/photo/page.tsx) | Route fine, page serveur réutilisée avec ses droits ; dialog natif ; E2E fermeture, historique, accès direct. |
| [src/app/@overlay/(.)tree/[id]/members/new/page.tsx](../../src/app/@overlay/(.)tree/[id]/members/new/page.tsx) | Route fine, page serveur réutilisée avec ses droits ; dialog natif ; E2E fermeture, historique, accès direct. |
| [src/app/@overlay/(.)tree/[id]/pending/approve-all/page.tsx](../../src/app/@overlay/(.)tree/[id]/pending/approve-all/page.tsx) | Route fine, page serveur réutilisée avec ses droits ; dialog natif ; E2E fermeture, historique, accès direct. |
| [src/app/@overlay/(.)tree/[id]/pending/page.tsx](../../src/app/@overlay/(.)tree/[id]/pending/page.tsx) | Route fine, page serveur réutilisée avec ses droits ; dialog natif ; E2E fermeture, historique, accès direct. |
| [src/app/@overlay/(.)tree/[id]/pending/reject-all/page.tsx](../../src/app/@overlay/(.)tree/[id]/pending/reject-all/page.tsx) | Route fine, page serveur réutilisée avec ses droits ; dialog natif ; E2E fermeture, historique, accès direct. |
| [src/app/@overlay/(.)tree/[id]/settings/page.tsx](../../src/app/@overlay/(.)tree/[id]/settings/page.tsx) | Route fine, page serveur réutilisée avec ses droits ; dialog natif ; E2E fermeture, historique, accès direct. |
| [src/app/@overlay/(.)tree/[id]/suggestions/page.tsx](../../src/app/@overlay/(.)tree/[id]/suggestions/page.tsx) | Route fine, page serveur réutilisée avec ses droits ; dialog natif ; E2E fermeture, historique, accès direct. |
| [src/app/@overlay/(.)tree/[id]/union/[unionId]/delete/page.tsx](../../src/app/@overlay/(.)tree/[id]/union/[unionId]/delete/page.tsx) | Route fine, page serveur réutilisée avec ses droits ; dialog natif ; E2E fermeture, historique, accès direct. |
| [src/app/@overlay/(.)tree/[id]/union/[unionId]/edit/page.tsx](../../src/app/@overlay/(.)tree/[id]/union/[unionId]/edit/page.tsx) | Route fine, page serveur réutilisée avec ses droits ; dialog natif ; E2E fermeture, historique, accès direct. |
| [src/app/@overlay/(.)tree/[id]/union/[unionId]/page.tsx](../../src/app/@overlay/(.)tree/[id]/union/[unionId]/page.tsx) | Route fine, page serveur réutilisée avec ses droits ; dialog natif ; E2E fermeture, historique, accès direct. |
| [src/app/@overlay/(.)tree/[id]/unions/new/page.tsx](../../src/app/@overlay/(.)tree/[id]/unions/new/page.tsx) | Route fine, page serveur réutilisée avec ses droits ; dialog natif ; E2E fermeture, historique, accès direct. |
| [src/app/@overlay/(.)trees/new/page.tsx](../../src/app/@overlay/(.)trees/new/page.tsx) | Route fine, page serveur réutilisée avec ses droits ; dialog natif ; E2E fermeture, historique, accès direct. |
| [src/app/@overlay/[...catchAll]/page.tsx](../../src/app/@overlay/[...catchAll]/page.tsx) | Route fine, page serveur réutilisée avec ses droits ; dialog natif ; E2E fermeture, historique, accès direct. |
| [src/app/@overlay/default.tsx](../../src/app/@overlay/default.tsx) | Route fine, page serveur réutilisée avec ses droits ; dialog natif ; E2E fermeture, historique, accès direct. |
| [src/app/actions/member-photo-actions.ts](../../src/app/actions/member-photo-actions.ts) | Contrôleur mince : auth, budget et garde d’écriture préservés ; E2E photo/revue, intégration inchangée. |
| [src/app/actions/review-actions.ts](../../src/app/actions/review-actions.ts) | Contrôleur mince : auth, budget et garde d’écriture préservés ; E2E photo/revue, intégration inchangée. |
| [src/app/globals.css](../../src/app/globals.css) | Tokens partagés et règles ciblées ; vérification visuelle desktop/mobile et axe. |
| [src/app/layout.tsx](../../src/app/layout.tsx) | Composition RSC et DI existante, aucun accès Prisma direct ; métadonnées/contrôles préservés ; E2E parcours. |
| [src/app/page.tsx](../../src/app/page.tsx) | Composition RSC et DI existante, aucun accès Prisma direct ; métadonnées/contrôles préservés ; E2E parcours. |
| [src/app/tree/[id]/collaborators/page.tsx](../../src/app/tree/[id]/collaborators/page.tsx) | Composition RSC et DI existante, aucun accès Prisma direct ; métadonnées/contrôles préservés ; E2E parcours. |
| [src/app/tree/[id]/graph/graph-view-content.tsx](../../src/app/tree/[id]/graph/graph-view-content.tsx) | Mapping typé et données readonly ; autorisations métier conservées ; tests unitaires et E2E rôles/graphe. |
| [src/app/tree/[id]/graph/page.tsx](../../src/app/tree/[id]/graph/page.tsx) | Mapping typé et données readonly ; autorisations métier conservées ; tests unitaires et E2E rôles/graphe. |
| [src/app/tree/[id]/layout.tsx](../../src/app/tree/[id]/layout.tsx) | Composition RSC et DI existante, aucun accès Prisma direct ; métadonnées/contrôles préservés ; E2E parcours. |
| [src/app/tree/[id]/load-workspace-counters.ts](../../src/app/tree/[id]/load-workspace-counters.ts) | Composition RSC et DI existante, aucun accès Prisma direct ; métadonnées/contrôles préservés ; E2E parcours. |
| [src/app/tree/[id]/member/[memberId]/edit/page.tsx](../../src/app/tree/[id]/member/[memberId]/edit/page.tsx) | Composition RSC et DI existante, aucun accès Prisma direct ; métadonnées/contrôles préservés ; E2E parcours. |
| [src/app/tree/[id]/member/[memberId]/page.tsx](../../src/app/tree/[id]/member/[memberId]/page.tsx) | Composition RSC et DI existante, aucun accès Prisma direct ; métadonnées/contrôles préservés ; E2E parcours. |
| [src/app/tree/[id]/page.tsx](../../src/app/tree/[id]/page.tsx) | Composition RSC et DI existante, aucun accès Prisma direct ; métadonnées/contrôles préservés ; E2E parcours. |
| [src/app/tree/[id]/pending/page.tsx](../../src/app/tree/[id]/pending/page.tsx) | Composition RSC et DI existante, aucun accès Prisma direct ; métadonnées/contrôles préservés ; E2E parcours. |
| [src/app/tree/[id]/tree-workspace-page.tsx](../../src/app/tree/[id]/tree-workspace-page.tsx) | Composition RSC et DI existante, aucun accès Prisma direct ; métadonnées/contrôles préservés ; E2E parcours. |
| [src/presentation/components/family-graph/bridge-link-buttons.tsx](../../src/presentation/components/family-graph/bridge-link-buttons.tsx) | Mapping typé et données readonly ; autorisations métier conservées ; tests unitaires et E2E rôles/graphe. |
| [src/presentation/components/family-graph/family-graph-island.tsx](../../src/presentation/components/family-graph/family-graph-island.tsx) | Mapping typé et données readonly ; autorisations métier conservées ; tests unitaires et E2E rôles/graphe. |
| [src/presentation/components/family-graph/family-graph.tsx](../../src/presentation/components/family-graph/family-graph.tsx) | Mapping typé et données readonly ; autorisations métier conservées ; tests unitaires et E2E rôles/graphe. |
| [src/presentation/components/family-graph/flow-nodes.ts](../../src/presentation/components/family-graph/flow-nodes.ts) | Mapping typé et données readonly ; autorisations métier conservées ; tests unitaires et E2E rôles/graphe. |
| [src/presentation/components/family-graph/foreign-origin-tag.tsx](../../src/presentation/components/family-graph/foreign-origin-tag.tsx) | Mapping typé et données readonly ; autorisations métier conservées ; tests unitaires et E2E rôles/graphe. |
| [src/presentation/components/family-graph/graph-filters-panel.tsx](../../src/presentation/components/family-graph/graph-filters-panel.tsx) | Mapping typé et données readonly ; autorisations métier conservées ; tests unitaires et E2E rôles/graphe. |
| [src/presentation/components/family-graph/graph-interaction-controls.tsx](../../src/presentation/components/family-graph/graph-interaction-controls.tsx) | Mapping typé et données readonly ; autorisations métier conservées ; tests unitaires et E2E rôles/graphe. |
| [src/presentation/components/family-graph/graph-presentation-props.ts](../../src/presentation/components/family-graph/graph-presentation-props.ts) | Mapping typé et données readonly ; autorisations métier conservées ; tests unitaires et E2E rôles/graphe. |
| [src/presentation/components/family-graph/graph-status.tsx](../../src/presentation/components/family-graph/graph-status.tsx) | Mapping typé et données readonly ; autorisations métier conservées ; tests unitaires et E2E rôles/graphe. |
| [src/presentation/components/family-graph/graph-toolbar.tsx](../../src/presentation/components/family-graph/graph-toolbar.tsx) | Mapping typé et données readonly ; autorisations métier conservées ; tests unitaires et E2E rôles/graphe. |
| [src/presentation/components/family-graph/member-node.tsx](../../src/presentation/components/family-graph/member-node.tsx) | Mapping typé et données readonly ; autorisations métier conservées ; tests unitaires et E2E rôles/graphe. |
| [src/presentation/components/family-graph/member-pivot-button.tsx](../../src/presentation/components/family-graph/member-pivot-button.tsx) | Mapping typé et données readonly ; autorisations métier conservées ; tests unitaires et E2E rôles/graphe. |
| [src/presentation/components/family-graph/use-graph-positions.ts](../../src/presentation/components/family-graph/use-graph-positions.ts) | Mapping typé et données readonly ; autorisations métier conservées ; tests unitaires et E2E rôles/graphe. |
| [src/presentation/components/forms/form-error-summary.tsx](../../src/presentation/components/forms/form-error-summary.tsx) | Champs nommés, focus clavier et annonces d’erreurs ; E2E validation/onglets, axe. |
| [src/presentation/components/forms/invite-form.tsx](../../src/presentation/components/forms/invite-form.tsx) | Champs nommés, focus clavier et annonces d’erreurs ; E2E validation/onglets, axe. |
| [src/presentation/components/forms/member-form.tsx](../../src/presentation/components/forms/member-form.tsx) | Champs nommés, focus clavier et annonces d’erreurs ; E2E validation/onglets, axe. |
| [src/presentation/components/forms/member-photo-form.tsx](../../src/presentation/components/forms/member-photo-form.tsx) | Champs nommés, focus clavier et annonces d’erreurs ; E2E validation/onglets, axe. |
| [src/presentation/components/forms/partial-date-field.tsx](../../src/presentation/components/forms/partial-date-field.tsx) | Champs nommés, focus clavier et annonces d’erreurs ; E2E validation/onglets, axe. |
| [src/presentation/components/forms/text-area-field.tsx](../../src/presentation/components/forms/text-area-field.tsx) | Champs nommés, focus clavier et annonces d’erreurs ; E2E validation/onglets, axe. |
| [src/presentation/components/forms/text-field.tsx](../../src/presentation/components/forms/text-field.tsx) | Champs nommés, focus clavier et annonces d’erreurs ; E2E validation/onglets, axe. |
| [src/presentation/components/navigation/copy-tree-link.tsx](../../src/presentation/components/navigation/copy-tree-link.tsx) | État client limité à la navigation/aide ; pas de token local ; E2E historique, focus, compte et tour. |
| [src/presentation/components/navigation/guided-tour.tsx](../../src/presentation/components/navigation/guided-tour.tsx) | État client limité à la navigation/aide ; pas de token local ; E2E historique, focus, compte et tour. |
| [src/presentation/components/navigation/header-navigation.tsx](../../src/presentation/components/navigation/header-navigation.tsx) | État client limité à la navigation/aide ; pas de token local ; E2E historique, focus, compte et tour. |
| [src/presentation/components/navigation/notification-badge.tsx](../../src/presentation/components/navigation/notification-badge.tsx) | État client limité à la navigation/aide ; pas de token local ; E2E historique, focus, compte et tour. |
| [src/presentation/components/navigation/route-overlay.tsx](../../src/presentation/components/navigation/route-overlay.tsx) | État client limité à la navigation/aide ; pas de token local ; E2E historique, focus, compte et tour. |
| [src/presentation/components/ui/button.tsx](../../src/presentation/components/ui/button.tsx) | Présentation typée, props readonly, composants sémantiques ; E2E parcours et accessibilité. |
| [src/presentation/components/ui/content-tabs.tsx](../../src/presentation/components/ui/content-tabs.tsx) | Champs nommés, focus clavier et annonces d’erreurs ; E2E validation/onglets, axe. |
| [src/presentation/components/ui/date-field.tsx](../../src/presentation/components/ui/date-field.tsx) | Présentation typée, props readonly, composants sémantiques ; E2E parcours et accessibilité. |
| [src/presentation/components/ui/form-tabs.tsx](../../src/presentation/components/ui/form-tabs.tsx) | Champs nommés, focus clavier et annonces d’erreurs ; E2E validation/onglets, axe. |
| [src/presentation/components/ui/icon.tsx](../../src/presentation/components/ui/icon.tsx) | Présentation typée, props readonly, composants sémantiques ; E2E parcours et accessibilité. |
| [src/presentation/components/ui/labelled-select.tsx](../../src/presentation/components/ui/labelled-select.tsx) | Présentation typée, props readonly, composants sémantiques ; E2E parcours et accessibilité. |
| [src/presentation/components/ui/search-field.tsx](../../src/presentation/components/ui/search-field.tsx) | Présentation typée, props readonly, composants sémantiques ; E2E parcours et accessibilité. |
| [src/presentation/forms/member-field-tab.ts](../../src/presentation/forms/member-field-tab.ts) | Champs nommés, focus clavier et annonces d’erreurs ; E2E validation/onglets, axe. |
| [src/presentation/graph/family-graph-types.ts](../../src/presentation/graph/family-graph-types.ts) | Mapping typé et données readonly ; autorisations métier conservées ; tests unitaires et E2E rôles/graphe. |
| [src/presentation/graph/family-graph-view-models.ts](../../src/presentation/graph/family-graph-view-models.ts) | Mapping typé et données readonly ; autorisations métier conservées ; tests unitaires et E2E rôles/graphe. |
| [src/presentation/graph/graph-dimensions.ts](../../src/presentation/graph/graph-dimensions.ts) | Mapping typé et données readonly ; autorisations métier conservées ; tests unitaires et E2E rôles/graphe. |
| [src/presentation/graph/layout-family-graph.ts](../../src/presentation/graph/layout-family-graph.ts) | Mapping typé et données readonly ; autorisations métier conservées ; tests unitaires et E2E rôles/graphe. |
| [src/presentation/mappers/member-view-models.ts](../../src/presentation/mappers/member-view-models.ts) | Mapping typé et données readonly ; autorisations métier conservées ; tests unitaires et E2E rôles/graphe. |
| [src/presentation/mappers/tree-view-models.ts](../../src/presentation/mappers/tree-view-models.ts) | Mapping typé et données readonly ; autorisations métier conservées ; tests unitaires et E2E rôles/graphe. |
| [src/presentation/schemas/bulk-review-result.ts](../../src/presentation/schemas/bulk-review-result.ts) | Validation Zod de compteurs bornés, sans texte libre ; tests unitaires écrits avant correction. |
| [src/presentation/styles/overlays.css](../../src/presentation/styles/overlays.css) | Tokens partagés et règles ciblées ; vérification visuelle desktop/mobile et axe. |
| [src/presentation/styles/shell.css](../../src/presentation/styles/shell.css) | Tokens partagés et règles ciblées ; vérification visuelle desktop/mobile et axe. |
| [src/presentation/styles/tours.css](../../src/presentation/styles/tours.css) | Tokens partagés et règles ciblées ; vérification visuelle desktop/mobile et axe. |
| [src/presentation/styles/workspace.css](../../src/presentation/styles/workspace.css) | Tokens partagés et règles ciblées ; vérification visuelle desktop/mobile et axe. |
| [src/presentation/tours/tour-steps.ts](../../src/presentation/tours/tour-steps.ts) | État client limité à la navigation/aide ; pas de token local ; E2E historique, focus, compte et tour. |
| [src/presentation/tours/tour-storage.ts](../../src/presentation/tours/tour-storage.ts) | État client limité à la navigation/aide ; pas de token local ; E2E historique, focus, compte et tour. |
| [src/presentation/views/account-nav.tsx](../../src/presentation/views/account-nav.tsx) | Code devenu inutilisé supprimé ; références vérifiées, typecheck et E2E navigation. |
| [src/presentation/views/explore-header-view.tsx](../../src/presentation/views/explore-header-view.tsx) | Présentation typée, props readonly, composants sémantiques ; E2E parcours et accessibilité. |
| [src/presentation/views/family-graph-view.tsx](../../src/presentation/views/family-graph-view.tsx) | Présentation typée, props readonly, composants sémantiques ; E2E parcours et accessibilité. |
| [src/presentation/views/graph-tools-view.tsx](../../src/presentation/views/graph-tools-view.tsx) | Présentation typée, props readonly, composants sémantiques ; E2E parcours et accessibilité. |
| [src/presentation/views/member-profile-view.tsx](../../src/presentation/views/member-profile-view.tsx) | Présentation typée, props readonly, composants sémantiques ; E2E parcours et accessibilité. |
| [src/presentation/views/notifications-view.tsx](../../src/presentation/views/notifications-view.tsx) | Présentation typée, props readonly, composants sémantiques ; E2E parcours et accessibilité. |
| [src/presentation/views/pending-changes-view.tsx](../../src/presentation/views/pending-changes-view.tsx) | Présentation typée, props readonly, composants sémantiques ; E2E parcours et accessibilité. |
| [src/presentation/views/site-header.tsx](../../src/presentation/views/site-header.tsx) | Présentation typée, props readonly, composants sémantiques ; E2E parcours et accessibilité. |
| [src/presentation/views/tree-facts.tsx](../../src/presentation/views/tree-facts.tsx) | Code devenu inutilisé supprimé ; références vérifiées, typecheck et E2E navigation. |
| [src/presentation/views/tree-list-view.tsx](../../src/presentation/views/tree-list-view.tsx) | Présentation typée, props readonly, composants sémantiques ; E2E parcours et accessibilité. |
| [src/presentation/views/tree-overview-view.tsx](../../src/presentation/views/tree-overview-view.tsx) | Code devenu inutilisé supprimé ; références vérifiées, typecheck et E2E navigation. |
| [src/presentation/views/tree-workspace-header.tsx](../../src/presentation/views/tree-workspace-header.tsx) | Présentation typée, props readonly, composants sémantiques ; E2E parcours et accessibilité. |
| [tests/e2e/auth.spec.ts](../../tests/e2e/auth.spec.ts) | Données synthétiques isolées ; assertions comportementales et droits conservés ; Playwright. |
| [tests/e2e/cross-tree-branch.spec.ts](../../tests/e2e/cross-tree-branch.spec.ts) | Données synthétiques isolées ; assertions comportementales et droits conservés ; Playwright. |
| [tests/e2e/explore.spec.ts](../../tests/e2e/explore.spec.ts) | Données synthétiques isolées ; assertions comportementales et droits conservés ; Playwright. |
| [tests/e2e/graph-modes.spec.ts](../../tests/e2e/graph-modes.spec.ts) | Données synthétiques isolées ; assertions comportementales et droits conservés ; Playwright. |
| [tests/e2e/graph-pivot.spec.ts](../../tests/e2e/graph-pivot.spec.ts) | Données synthétiques isolées ; assertions comportementales et droits conservés ; Playwright. |
| [tests/e2e/graph.spec.ts](../../tests/e2e/graph.spec.ts) | Données synthétiques isolées ; assertions comportementales et droits conservés ; Playwright. |
| [tests/e2e/invitations.spec.ts](../../tests/e2e/invitations.spec.ts) | Données synthétiques isolées ; assertions comportementales et droits conservés ; Playwright. |
| [tests/e2e/member-writes.spec.ts](../../tests/e2e/member-writes.spec.ts) | Données synthétiques isolées ; assertions comportementales et droits conservés ; Playwright. |
| [tests/e2e/members.spec.ts](../../tests/e2e/members.spec.ts) | Données synthétiques isolées ; assertions comportementales et droits conservés ; Playwright. |
| [tests/e2e/navigation.spec.ts](../../tests/e2e/navigation.spec.ts) | Données synthétiques isolées ; assertions comportementales et droits conservés ; Playwright. |
| [tests/e2e/notifications.spec.ts](../../tests/e2e/notifications.spec.ts) | Données synthétiques isolées ; assertions comportementales et droits conservés ; Playwright. |
| [tests/e2e/pending-changes.spec.ts](../../tests/e2e/pending-changes.spec.ts) | Données synthétiques isolées ; assertions comportementales et droits conservés ; Playwright. |
| [tests/e2e/support/fixtures.ts](../../tests/e2e/support/fixtures.ts) | Données synthétiques isolées ; assertions comportementales et droits conservés ; Playwright. |
| [tests/e2e/trees.spec.ts](../../tests/e2e/trees.spec.ts) | Données synthétiques isolées ; assertions comportementales et droits conservés ; Playwright. |
| [tests/e2e/union-writes.spec.ts](../../tests/e2e/union-writes.spec.ts) | Retour au graphe après création, ouverture de l’union et ajout d’enfant ; refus des cycles et droits conservés ; Playwright, régression écrite avant correction. |
| [tests/e2e/ui-parity.spec.ts](../../tests/e2e/ui-parity.spec.ts) | Données synthétiques isolées ; assertions comportementales et droits conservés ; Playwright. |
| [tests/e2e/ui-parity.spec.ts-snapshots/dashboard-desktop-chromium-win32.png](../../tests/e2e/ui-parity.spec.ts-snapshots/dashboard-desktop-chromium-win32.png) | Capture locale avec données synthétiques ; contrôle visuel puis comparaison Playwright. |
| [tests/e2e/ui-parity.spec.ts-snapshots/member-create-desktop-chromium-win32.png](../../tests/e2e/ui-parity.spec.ts-snapshots/member-create-desktop-chromium-win32.png) | Capture locale avec données synthétiques ; contrôle visuel puis comparaison Playwright. |
| [tests/e2e/ui-parity.spec.ts-snapshots/member-profile-desktop-chromium-win32.png](../../tests/e2e/ui-parity.spec.ts-snapshots/member-profile-desktop-chromium-win32.png) | Capture locale avec données synthétiques ; contrôle visuel puis comparaison Playwright. |
| [tests/e2e/ui-parity.spec.ts-snapshots/tree-empty-desktop-chromium-win32.png](../../tests/e2e/ui-parity.spec.ts-snapshots/tree-empty-desktop-chromium-win32.png) | Capture locale avec données synthétiques ; contrôle visuel puis comparaison Playwright. |
| [tests/e2e/ui-parity.spec.ts-snapshots/tree-empty-mobile-chromium-win32.png](../../tests/e2e/ui-parity.spec.ts-snapshots/tree-empty-mobile-chromium-win32.png) | Capture locale avec données synthétiques ; contrôle visuel puis comparaison Playwright. |
| [tests/e2e/ui-parity.spec.ts-snapshots/tree-populated-desktop-chromium-win32.png](../../tests/e2e/ui-parity.spec.ts-snapshots/tree-populated-desktop-chromium-win32.png) | Capture locale avec données synthétiques ; contrôle visuel puis comparaison Playwright. |
| [tests/unit/presentation/bulk-review-result.test.ts](../../tests/unit/presentation/bulk-review-result.test.ts) | Assertions métier et cas limites ; aucun mock de la fonction testée ; Vitest. |
| [tests/unit/presentation/family-graph-view-models.test.ts](../../tests/unit/presentation/family-graph-view-models.test.ts) | Assertions métier et cas limites ; aucun mock de la fonction testée ; Vitest. |
| [tests/unit/presentation/graph-filters.test.ts](../../tests/unit/presentation/graph-filters.test.ts) | Assertions métier et cas limites ; aucun mock de la fonction testée ; Vitest. |
| [tests/unit/presentation/member-view-models.test.ts](../../tests/unit/presentation/member-view-models.test.ts) | Assertions métier et cas limites ; aucun mock de la fonction testée ; Vitest. |
| [tests/unit/presentation/tree-view-models.test.ts](../../tests/unit/presentation/tree-view-models.test.ts) | Assertions métier et cas limites ; aucun mock de la fonction testée ; Vitest. |
