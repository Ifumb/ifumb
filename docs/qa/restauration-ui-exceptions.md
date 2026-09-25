# Exceptions de lisibilité

Les déclarations ci-dessous dépassent 20 lignes pour conserver une structure cohérente.
Chaque fonction est accompagnée d’une justification `reason:` dans le code. Aucun nouveau `any`, `ts-ignore` ou contournement de lint.
Les classes Tailwind et certains types/URLs dépassent 120 caractères pour rester directement recherchables.
Les imports CSS relatifs traversent un dossier parce que leur résolution relève de CSS, et sont justifiés dans `globals.css`.

| Fichier | Fonction | Ligne | Lignes |
| --- | --- | --- | --- |
| [src/app/(app)/dashboard/page.tsx](../../src/app/(app)/dashboard/page.tsx) | DashboardPage | 14 | 29 |
| [src/app/actions/review-actions.ts](../../src/app/actions/review-actions.ts) | reviewAllPendingChangesAction | 65 | 25 |
| [src/app/page.tsx](../../src/app/page.tsx) | HomePage | 9 | 33 |
| [src/app/tree/[id]/collaborators/page.tsx](../../src/app/tree/[id]/collaborators/page.tsx) | CollaboratorsPage | 26 | 24 |
| [src/app/tree/[id]/graph/graph-view-content.tsx](../../src/app/tree/[id]/graph/graph-view-content.tsx) | GraphViewContent | 36 | 26 |
| [src/app/tree/[id]/graph/graph-view-content.tsx](../../src/app/tree/[id]/graph/graph-view-content.tsx) | modeOutcome | 64 | 22 |
| [src/app/tree/[id]/member/[memberId]/edit/page.tsx](../../src/app/tree/[id]/member/[memberId]/edit/page.tsx) | EditMember | 28 | 22 |
| [src/app/tree/[id]/pending/page.tsx](../../src/app/tree/[id]/pending/page.tsx) | unreadablePendingChanges | 47 | 21 |
| [src/app/tree/[id]/tree-workspace-page.tsx](../../src/app/tree/[id]/tree-workspace-page.tsx) | TreeWorkspacePage | 26 | 54 |
| [src/presentation/components/family-graph/bridge-link-buttons.tsx](../../src/presentation/components/family-graph/bridge-link-buttons.tsx) | BridgeLinkButton | 28 | 21 |
| [src/presentation/components/family-graph/family-graph.tsx](../../src/presentation/components/family-graph/family-graph.tsx) | FamilyGraphCanvas | 68 | 57 |
| [src/presentation/components/family-graph/family-graph.tsx](../../src/presentation/components/family-graph/family-graph.tsx) | GraphCanvas | 129 | 43 |
| [src/presentation/components/family-graph/graph-filters-panel.tsx](../../src/presentation/components/family-graph/graph-filters-panel.tsx) | filterFields | 64 | 21 |
| [src/presentation/components/family-graph/graph-interaction-controls.tsx](../../src/presentation/components/family-graph/graph-interaction-controls.tsx) | GraphInteractionControls | 13 | 30 |
| [src/presentation/components/family-graph/graph-toolbar.tsx](../../src/presentation/components/family-graph/graph-toolbar.tsx) | GraphToolbar | 17 | 57 |
| [src/presentation/components/family-graph/member-node.tsx](../../src/presentation/components/family-graph/member-node.tsx) | MemberNode | 47 | 33 |
| [src/presentation/components/forms/form-error-summary.tsx](../../src/presentation/components/forms/form-error-summary.tsx) | FormErrorSummary | 15 | 48 |
| [src/presentation/components/forms/invite-form.tsx](../../src/presentation/components/forms/invite-form.tsx) | InviteForm | 23 | 24 |
| [src/presentation/components/forms/member-form.tsx](../../src/presentation/components/forms/member-form.tsx) | MemberForm | 46 | 37 |
| [src/presentation/components/forms/member-form.tsx](../../src/presentation/components/forms/member-form.tsx) | IdentitySection | 85 | 21 |
| [src/presentation/components/forms/member-photo-form.tsx](../../src/presentation/components/forms/member-photo-form.tsx) | PhotoFileField | 47 | 21 |
| [src/presentation/components/forms/partial-date-field.tsx](../../src/presentation/components/forms/partial-date-field.tsx) | NumberPart | 69 | 24 |
| [src/presentation/components/forms/text-area-field.tsx](../../src/presentation/components/forms/text-area-field.tsx) | TextAreaField | 20 | 22 |
| [src/presentation/components/forms/text-field.tsx](../../src/presentation/components/forms/text-field.tsx) | TextField | 19 | 25 |
| [src/presentation/components/navigation/copy-tree-link.tsx](../../src/presentation/components/navigation/copy-tree-link.tsx) | CopyTreeLink | 7 | 34 |
| [src/presentation/components/navigation/guided-tour.tsx](../../src/presentation/components/navigation/guided-tour.tsx) | GuidedTour | 10 | 100 |
| [src/presentation/components/navigation/header-navigation.tsx](../../src/presentation/components/navigation/header-navigation.tsx) | HeaderNavigation | 17 | 23 |
| [src/presentation/components/navigation/header-navigation.tsx](../../src/presentation/components/navigation/header-navigation.tsx) | PrimaryLinks | 42 | 28 |
| [src/presentation/components/navigation/header-navigation.tsx](../../src/presentation/components/navigation/header-navigation.tsx) | AccountLinks | 72 | 48 |
| [src/presentation/components/navigation/notification-badge.tsx](../../src/presentation/components/navigation/notification-badge.tsx) | NotificationBadge | 18 | 42 |
| [src/presentation/components/navigation/route-overlay.tsx](../../src/presentation/components/navigation/route-overlay.tsx) | RouteOverlay | 14 | 38 |
| [src/presentation/components/ui/form-tabs.tsx](../../src/presentation/components/ui/form-tabs.tsx) | FormTabs | 13 | 41 |
| [src/presentation/components/ui/labelled-select.tsx](../../src/presentation/components/ui/labelled-select.tsx) | LabelledSelect | 33 | 21 |
| [src/presentation/graph/family-graph-view-models.ts](../../src/presentation/graph/family-graph-view-models.ts) | toUnlaidGraph | 47 | 33 |
| [src/presentation/graph/family-graph-view-models.ts](../../src/presentation/graph/family-graph-view-models.ts) | toMemberNodeData | 89 | 36 |
| [src/presentation/graph/layout-family-graph.ts](../../src/presentation/graph/layout-family-graph.ts) | toMergedFamilyGraphViewModel | 54 | 25 |
| [src/presentation/graph/layout-family-graph.ts](../../src/presentation/graph/layout-family-graph.ts) | mergeForeignBranch | 82 | 30 |
| [src/presentation/graph/layout-family-graph.ts](../../src/presentation/graph/layout-family-graph.ts) | layoutNodes | 118 | 22 |
| [src/presentation/mappers/member-view-models.ts](../../src/presentation/mappers/member-view-models.ts) | toMemberProfileViewModel | 73 | 26 |
| [src/presentation/mappers/tree-view-models.ts](../../src/presentation/mappers/tree-view-models.ts) | toTreeViewModel | 32 | 21 |
| [src/presentation/views/graph-tools-view.tsx](../../src/presentation/views/graph-tools-view.tsx) | LineageForm | 56 | 21 |
| [src/presentation/views/member-profile-view.tsx](../../src/presentation/views/member-profile-view.tsx) | MemberProfileView | 16 | 30 |
| [src/presentation/views/member-profile-view.tsx](../../src/presentation/views/member-profile-view.tsx) | ProfileLinks | 100 | 23 |
| [src/presentation/views/notifications-view.tsx](../../src/presentation/views/notifications-view.tsx) | NotificationsView | 17 | 25 |
| [src/presentation/views/notifications-view.tsx](../../src/presentation/views/notifications-view.tsx) | NotificationItem | 44 | 23 |
| [src/presentation/views/pending-changes-view.tsx](../../src/presentation/views/pending-changes-view.tsx) | PendingChangesView | 32 | 36 |
| [src/presentation/views/pending-changes-view.tsx](../../src/presentation/views/pending-changes-view.tsx) | PendingChangeItem | 76 | 60 |
| [src/presentation/views/site-header.tsx](../../src/presentation/views/site-header.tsx) | SiteHeader | 8 | 26 |
| [src/presentation/views/tree-list-view.tsx](../../src/presentation/views/tree-list-view.tsx) | TreeCard | 32 | 24 |
| [src/presentation/views/tree-workspace-header.tsx](../../src/presentation/views/tree-workspace-header.tsx) | TreeWorkspaceHeader | 10 | 58 |
| [src/presentation/views/tree-workspace-header.tsx](../../src/presentation/views/tree-workspace-header.tsx) | TreeGraphActions | 110 | 28 |
