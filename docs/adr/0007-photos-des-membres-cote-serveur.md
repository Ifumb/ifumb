# 0007 — Photos des membres : envoi et traitement côté serveur

## Status

Accepted — 2026-09-15. Précise les ADR 0001 (base et projet Supabase partagés) et 0005 (écritures
de développement en staging).

## Context

Dans le legacy, le navigateur envoie la photo d'un membre directement dans le bucket public
Supabase Storage `member-photos`, avec la clé `anon` publiée dans le bundle JavaScript, sous le
chemin `{treeId}/{memberId}.{extension}` et en écrasant le fichier existant ; il enregistre ensuite
l'URL par `PATCH /members/:id`. Aucun contrôle n'a lieu côté serveur :

- l'autorisation d'écrire dans le bucket ne dépend que de ses règles d'accès, pas des droits sur
  l'arbre ; un éditeur qui propose une photo l'écrase immédiatement, avant toute revue ;
- `photoUrl` accepte n'importe quelle chaîne ;
- le type et la taille ne sont vérifiés que dans le navigateur ; un SVG est accepté ;
- les métadonnées EXIF (dont la position GPS) sont publiées avec la photo ;
- les fichiers remplacés sous une autre extension, ou ceux des membres supprimés, restent en ligne,
  et une photo remplacée garde la même URL (cache périmé).

Options considérées : garder l'envoi depuis le navigateur avec des URL signées ; envoyer au serveur,
qui stocke le fichier tel quel ; envoyer au serveur, qui ré-encode la photo avant de la stocker.

## Decision

- **Le serveur reçoit la photo** par une Server Action (corps limité à 6 Mo) et la stocke dans le
  même bucket, par l'API REST de Storage, avec la **clé de service** `SUPABASE_SERVICE_ROLE_KEY`.
  Cette clé est lue au runtime, n'existe que dans `SupabasePhotoStorage`, n'est jamais journalisée
  et n'est jamais préfixée `NEXT_PUBLIC_`. Pas de `@supabase/supabase-js`.
- **Contrôles avant tout stockage** : droit d'édition de la fiche (propriétaire, ou compte qui l'a
  revendiquée ; les éditeurs attendront les modifications en attente), taille ≤ 5 Mo, format lu
  dans les premiers octets (JPEG, PNG, WebP), limites de débit `photoUploadByUser` et
  `treeWriteByUser`.
- **Ré-encodage avec `sharp`** (dépendance directe, version fixée) : décodage limité en pixels,
  orientation appliquée, plus grand côté ramené à 1024 px, sortie WebP **sans aucune métadonnée**.
- **Nom unique par envoi** : `{treeId}/{memberId}-{uuid}.webp`, jamais écrasé (`x-upsert: false`),
  servi avec un cache long. L'URL garde le format public du bucket, que le legacy affiche aussi.
- **Ordre et compensation** : stockage du fichier, puis transaction (URL et journal), puis
  suppression de l'ancien fichier. Si la transaction échoue, le nouveau fichier est supprimé. Une
  suppression qui échoue est journalisée côté serveur sans faire échouer l'action : un fichier
  orphelin vaut mieux qu'une photo perdue. Seules les URL du bucket configuré sont supprimées.
- **Suppression d'un membre** : son fichier de photo est supprimé après la transaction.
- **Environnements** : le stockage refuse d'écrire tant que `BUSINESS_WRITES_ENABLED` ne vaut pas
  `true` (ADR 0005). Sans `SUPABASE_URL` ou sans clé de service, les photos ne peuvent être ni
  ajoutées ni retirées et la page le dit. En développement, uniquement la clé du projet de staging.

## Consequences

- Nouvelle variable d'environnement secrète `SUPABASE_SERVICE_ROLE_KEY` (runtime) ; `SUPABASE_URL`
  reste lue au build (motif d'images de `next/image`) et au runtime.
- `sharp` est un binaire natif, pris en charge par une image Docker linux-x64 comme par Vercel.
- Les photos stockées ne portent plus d'informations de localisation ; les photos anciennes du
  legacy restent telles quelles tant qu'elles ne sont pas remplacées.
- Les tests n'atteignent jamais un vrai bucket : doublure en mémoire en unitaire, faux serveur HTTP
  en intégration et en bout en bout.
- **À trancher au cutover** : si les règles d'accès du bucket de production permettent l'écriture
  avec la clé `anon`, les retirer ferme la faille du legacy mais casse son envoi de photos. Tant que
  le legacy tourne, ce risque est hérité, pas introduit.
