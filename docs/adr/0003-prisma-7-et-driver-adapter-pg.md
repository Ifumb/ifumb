# 0003 — Prisma ORM 7 avec le driver adapter `@prisma/adapter-pg`

## Status
Accepted — 2026-09-13

## Context
Le legacy utilise Prisma 5.14 avec le moteur de requêtes Rust et le generator `prisma-client-js`.
Le skill d'architecture impose Prisma ORM 7 : client sans moteur Rust, generator `prisma-client` avec
`output` obligatoire, URL de connexion hors du schéma (`prisma.config.ts`), driver adapter
obligatoire. Rester en Prisma 5 aurait garanti un comportement identique sur la base partagée, au
prix d'une migration d'ORM plus tard, en pleine activité.

## Decision
- Prisma 7.10.0, client généré dans `src/infrastructure/persistence/prisma/generated/` (non
  commité, régénéré au `postinstall`) : les types Prisma ne peuvent pas sortir de la couche
  infrastructure.
- Driver adapter `@prisma/adapter-pg` sur un `pg.Pool` à taille bornée.
- Deux URL : `DATABASE_URL` (pooler Supabase, runtime) et `DIRECT_URL` (connexion directe, CLI).
- `prisma.config.ts` ne lit l'URL que si elle est définie, pour que `prisma generate` fonctionne
  sans secret (CI, clone neuf).
- Les dépendances vulnérables encore épinglées par la CLI Prisma 7.10.0 (`mysql2`, `deepmerge-ts`)
  sont forcées vers des versions corrigées par `overrides` dans `pnpm-workspace.yaml`.

## Consequences
- Les 10 migrations du legacy s'appliquent sans modification avec Prisma 7 (vérifié sur Postgres 16
  par les tests d'intégration).
- La taille du pool relève désormais du driver `pg` et non plus des paramètres d'URL Prisma : elle
  se configure dans `client.ts`.
- La compatibilité du pooler Supabase en mode transaction (pgbouncer) avec `adapter-pg` reste à
  confirmer sur la base réelle, à la première connexion.
- Les `overrides` sont à retirer dès que Prisma exige lui-même des versions saines.
