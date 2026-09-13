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
cp .env.example .env.local   # renseigner DATABASE_URL et DIRECT_URL
pnpm dev
```

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

`pnpm test` échoue si la couverture de `src/core/**` passe sous 90 %. Pour toute modification
d'interface, `pnpm test:e2e` (contrôle axe inclus) doit aussi passer.

## Commits

Conventional Commits, vérifiés par commitlint via le hook Husky `commit-msg`. La version de
`package.json` est pilotée par release-please et n'est jamais éditée à la main.
