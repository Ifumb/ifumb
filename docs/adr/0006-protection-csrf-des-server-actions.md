# 0006 — Protection CSRF des Server Actions d'écriture

## Status

Accepted — 2026-09-14. Complète l'ADR 0002 (session Auth.js en cookie).

## Context

Le legacy protégeait ses mutations par un JWT en `localStorage` et un cookie de rafraîchissement
`sameSite: strict`. ifumb-next remplace ces appels par des Server Actions authentifiées par le
cookie de session Auth.js : un navigateur l'envoie automatiquement, ce qui ouvre en principe la
porte aux requêtes forgées depuis un autre site (CSRF). Le module 2.2 porte les premières écritures
métier (créer et modifier un arbre) ; la protection doit être établie avant elles.

Options considérées : jeton CSRF applicatif dans chaque formulaire ; cookie de session
`SameSite=Strict` ; s'appuyer sur les protections intégrées de Next.js et d'Auth.js.

## Decision

Pas de jeton CSRF applicatif. Les Server Actions reposent sur des protections cumulées :

- elles ne sont invocables qu'en `POST`, jamais en `GET` ;
- Next.js compare automatiquement l'en-tête `Origin` à `Host` (ou `X-Forwarded-Host`) et rejette
  toute requête dont l'origine diffère ; ce contrôle n'est pas désactivable ;
  `experimental.serverActions.allowedOrigins` n'est **pas** renseigné ;
- les identifiants d'action sont chiffrés et renouvelés, et les actions inutilisées ne sont pas
  exposées ;
- le cookie de session Auth.js est `httpOnly`, `SameSite=Lax` et `Secure` en HTTPS : un formulaire
  `POST` venu d'un autre site ne l'emporte pas.

Ces protections ne disent rien de l'**autorisation** : chaque Server Action revérifie
l'authentification (`requireCurrentUser`) et chaque use case revérifie le droit d'agir
(par exemple `canManage` pour modifier un arbre). Un paramètre lié par `bind` ou un champ de
formulaire n'est jamais une preuve de droit.

## Consequences

- Aucun jeton à générer, stocker ou vérifier ; les formulaires restent de simples `<form action>`.
- Si un reverse proxy réécrit `Host` au cutover (ADR 0004), il faudra soit transmettre
  `X-Forwarded-Host`, soit ajouter explicitement le domaine public à `allowedOrigins`.
- Les écritures restent également limitées par utilisateur (`treeWriteByUser`) et bloquées tant que
  `BUSINESS_WRITES_ENABLED` n'est pas activé (ADR 0005).
- Un Route Handler de mutation, s'il en apparaît un (lien d'invitation au module 2.8), ne bénéficie
  pas du contrôle `Origin` automatique : il devra le faire lui-même ou rester en lecture.
