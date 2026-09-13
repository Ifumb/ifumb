# ifumb-next

Migration de l'application IFUMB (réseau généalogique culturel) vers Next.js 16, en Clean
Architecture. Les règles de migration sont dans le `CLAUDE.md` du dépôt parent ; les règles
d'architecture dans le skill `nextjs-clean-architect`.

## Prérequis

- Node.js >= 20.9
- **pnpm 12.3.4 exclusivement** (épinglé par `packageManager`) — npm, yarn et bun sont bloqués
- Docker, pour la base Postgres des tests d'intégration et E2E

## Démarrage

```bash
pnpm install
cp .env.example .env.local   # DATABASE_URL, DIRECT_URL, AUTH_SECRET, APP_URL, RESEND_*
pnpm dev
```

`AUTH_SECRET` se génère avec `pnpm dlx auth secret`. Sans les variables `RESEND_*`, la page
« Mot de passe oublié » échoue à la soumission ; le reste de l'application fonctionne.

## Base de données — règle absolue

L'application lit la base Supabase **partagée avec l'application legacy**. Sur cette base :

- autorisé : `pnpm db:generate`, `pnpm db:status` (lecture seule) ;
- **interdit : `prisma migrate dev`**, qui la réinitialiserait.

`prisma/migrations/` est une copie à l'identique des migrations du legacy : on n'y réécrit rien.
Les tests n'utilisent jamais cette base, mais le Postgres local de `docker-compose.test.yml`.

## Gate de fin de module

```bash
pnpm install && pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

`pnpm test` échoue si la couverture de `src/core/**` passe sous 90 %. Aucun secret n'est
nécessaire pour ce gate : le build ne se connecte à rien.

Avec Docker démarré, deux suites complètent le gate :

```bash
pnpm test:integration   # repositories Prisma contre le Postgres de test (migrations rejouées)
pnpm test:e2e           # parcours navigateur + contrôle axe, serveur de test sur le port 3100
```

Les deux démarrent le conteneur et appliquent les migrations eux-mêmes. Leurs variables de base
et d'auth sont forcées dans la configuration : elles ne peuvent pas atteindre la base partagée.

## Commits

Conventional Commits, vérifiés par commitlint via le hook Husky `commit-msg`. La version de
`package.json` est pilotée par release-please et n'est jamais éditée à la main.
