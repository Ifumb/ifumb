# Restauration UI et parcours IFUMB

Référence : code React de `ifumb-legacy/apps/web` et captures fournies par l’utilisateur.
Périmètre autorisé : restauration de la présentation Next.js, en conservant les corrections
fonctionnelles et de sécurité de la migration. Aucun déploiement ni commit effectué.

## Diagnostic

La migration avait reconstruit les pages avec une présentation minimale : navigation de compte
dans un second bloc, détails/liste de membres à la place de l’espace graphique, actions sous
forme de liens et écrans séparés à la place des modales. Les couleurs seules avaient été reprises.
Ce n’était donc pas simplement une feuille CSS manquante ni une contrainte imposée par Next.js.

L’architecture propre sépare la présentation du métier ; elle permet de restaurer les composants
visuels et les interactions sans réintroduire l’API NestJS ou les règles vulnérables du legacy.

## Changements

- Navbar commune et compacte, navigation responsive, compte et notifications dans le header.
- Dashboard : cartes d’arbres, typographie, palette IFUMB et création contextuelle.
- Espace arbre : graphe en pleine surface dès l’ouverture, même vide ; fil d’Ariane, barre
  d’actions, liste latérale, recherche de centrage et commandes du graphe.
- Cartes membres : prénom/nom séparés, couleurs des branches étrangères, bouton Pivot accessible
  au clavier ; minimap, verrouillage/déplacement local et réorganisation de la vue.
- Routes interceptées Next.js pour les modales et panneaux contextuels : paramètres, création,
  unions, invitations, collaborateurs, propositions, connexions, notifications et mot de passe.
- Fiche membre et édition en pages dédiées, conformément au parcours legacy ; onglets Identité,
  Dates & Lieux, Culture, Bio. Les champs saisis survivent aux changements d’onglet ; les erreurs
  affichent le bon panneau. La photo et la suppression disposent de confirmations contextuelles.
- Après création effective d’un membre ou d’une union, retour au graphe actualisé. Les propositions
  EDITOR conservent leur confirmation dans la modale et attendent toujours la validation du propriétaire.
- Visites guidées à la première visite et rejouables ; seul leur état « déjà vu » est local.
- Corrections des retours de mutation : la photo conserve sa modale et son annonce ; la revue
  groupée affiche une confirmation durable après navigation, avec compteurs validés par Zod.
- Suppression de trois anciennes vues devenues inutilisées.

## Sécurité et compatibilité conservées

Les entités, cas d’usage, repositories, migrations SQL, dépendances et verrouillage des versions
n’ont pas été modifiés par cette restauration. Les Server Actions continuent à contrôler
l’authentification, les autorisations, le budget de requêtes et la garde d’écriture.

Auth.js, invalidation des sessions, arbres privés, membres découvrables, propositions EDITOR,
restrictions OWNER, traitement/réencodage des photos, recherche publique et calculs de parenté
corrigés restent ceux de la migration. Aucun token d’authentification dans localStorage.

Les URL directes restent utilisables. Un rechargement d’une URL de modale affiche sa page
canonique ; le retour/avancement du navigateur restaure le contexte. Le changement de visibilité
d’un arbre passe par les paramètres et leur validation explicite. Les contrastes et cibles clavier
sont conservés même lorsqu’ils diffèrent légèrement des petits contrôles gris du legacy.

## Validation

| Vérification | Résultat |
| --- | --- |
| Installation figée hors ligne | Réussie : 621 paquets réutilisés, zéro téléchargement, Prisma/Husky générés |
| TypeScript | Réussi : `pnpm typecheck` |
| ESLint | Réussi : `pnpm lint` |
| Vitest | 111 fichiers, 887 tests réussis |
| Couverture core | lignes 98,22 %, branches 92,89 %, fonctions 97,45 %, instructions 96,86 % |
| Intégration Prisma/PostgreSQL | 21 fichiers, 127 tests réussis |
| Audit npm autorisé | Aucune vulnérabilité connue |
| Build de production | Réussi via le serveur de test Playwright |
| Playwright global | 94 scénarios réussis, un worker, 12,8 min |
| Contrôle UI après ajustement final des marges | 7 scénarios réussis, inclus dans la passe ciblée finale |
| Retour au graphe après création | Deux régressions reproduites avant correction ; créations membre/union et confirmation EDITOR réussies après correction |
| Passe ciblée finale sur le build de production | 16 scénarios réussis en 1,8 min : UI, écritures membres et unions |
| Comparaison des captures après revue | Six références Windows comparées avec succès, sans régénération des références |

Les tests utilisent PostgreSQL Docker jetable sur `localhost:55432` et un stockage photo simulé
localement, jamais la base Supabase ou un bucket réel. Les emails ne sont pas envoyés.
Une première passe avait réussi 92/93 scénarios ; la navigation de descendance avait dépassé
le délai d’assertion. La passe globale finale réussit aussi ce parcours. Les nouveaux boutons
Pivot ont été agrandis après un échec axe sur leur taille au dézoom ; les mêmes assertions
réussissent désormais. La suite conserve les contrôles de sécurité et les traces en cas d’échec.

Le 25 septembre, le dernier build et le lint ciblé ont réussi. Le premier lancement des scénarios
s’est arrêté avant les tests parce que Docker était éteint. Après démarrage de Docker, la passe
ciblée a utilisé ce même build de production via `E2E_USE_BUILD=1` et `playwright.ui.config.ts`.
Les journaux contiennent des fermetures anticipées de flux Next.js pendant les navigations et
des avertissements d’email non configuré dans l’environnement isolé ; les 16 scénarios réussissent.

## Captures et portée de la vérification visuelle

Six vues de référence sont enregistrées dans
[`tests/e2e/ui-parity.spec.ts-snapshots`](../../tests/e2e/ui-parity.spec.ts-snapshots) : dashboard,
arbre vide desktop/mobile, création de membre, arbre rempli et fiche membre.
Elles utilisent des données synthétiques. Ces captures Next.js servent de références de
non-régression ; elles ne constituent pas une comparaison pixel à pixel avec le legacy, dont
les captures fournies ont une autre hauteur et un autre cadrage.

La comparaison automatique des six images utilise Chromium sous Windows. La CI Ubuntu conserve
toutes les assertions de parcours et d’accessibilité et joint ses captures au rapport, avec une
annotation explicite ; elle ne compare pas ses polices système aux références Windows. Aucune
référence Linux n’est déclarée validée. Pour comparer localement le build déjà validé :

```powershell
$env:E2E_PORT='3995'
$env:E2E_USE_BUILD='1'
pnpm exec playwright test --config playwright.ui.config.ts tests/e2e/ui-parity.spec.ts
```

La suite vérifie les rôles, modes de graphe, branches inter-arbres, champs invalides, clavier,
focus, Escape, historique, affichage mobile et violations détectables par axe.

## Checklist et livraison

Le [manifeste par fichier](restauration-ui-fichiers.md) décrit les responsabilités et tests.
Les [exceptions de lisibilité](restauration-ui-exceptions.md) documentent les composants JSX et
mappings de plus de 20 lignes, avec justifications dans le code. Les fichiers source modifiés
restent sous 200 lignes. Les imports pointent vers les couches internes ; aucun accès Prisma
direct depuis la présentation, aucun `any` ou contournement des contrôles ajouté.

Les modifications antérieures de `.gitignore`, `package.json` et `playwright.smoke.config.ts`
sont conservées. L’ajout dans `CLAUDE.md` provient du générateur de documentation Next.js.

Commit proposé : `fix(ui): restore legacy visuals and navigation` — correction **patch**,
sans modification manuelle de la version. La publication n’est pas incluse dans cette tâche.
