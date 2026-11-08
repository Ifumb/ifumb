<!-- Registre des obligations du projet — relu et mis à jour à chaque audit (skill `legal`, references/audit-protocol.md § 9). -->

# Registre légal — IFUMB

- Dernier audit : 2026-11-07 · Références vérifiées au : 2026-10-09 (à revérifier avant lancement, notamment l'ordonnance gabonaise 0011/PR/2026) · Commit audité : `b740b0d`
- Qualification : secteur **réseau social/plateforme UGC de généalogie, sans paiement** · juridictions d'usage **Gabon (marché de lancement) + Belgique/UE (diaspora, dès le lancement) + accessible mondialement (couverture juridique approfondie limitée à ces deux zones pour l'instant, 2026-11-08)** · éditeur **non tranché (`OPEN`)** · mineurs **possible — données de mineurs saisies par des tiers, pas de compte mineur prévu** · données sensibles **oui (tribu/clan/ethnicité = origine ethnique)** · tiers **oui (Supabase, Vercel, Resend, Upstash)** · IA **non**

## ⚠️ Constat majeur du 2026-11-07 : le produit est déjà en production

Vérifié via la CLI Vercel authentifiée (`vercel ls`, `vercel inspect`, `vercel project inspect`) :
IFUMB **n'est pas un produit à auditer avant lancement** — il tourne en production sur
`ifumb.app` / `www.ifumb.app` depuis au moins **44-45 jours** (secrets de production configurés à
cette date), avec **10 déploiements de production** récents. Ceci contredit le suivi de
`ifumb/CLAUDE.md` qui présentait le cutover/runbook opérationnel comme non terminé — à
réconcilier avec l'utilisateur.

**Conséquence directe** : chaque jour qui passe sans politique de confidentialité, CGU ni
mentions légales publiées est un jour d'exposition réelle, pas théorique — ceci élève la priorité
de B1-B4 (§ Formalités préalables) et des écarts majeurs du rapport d'audit, qui ne sont plus des
« avant lancement » mais des « dès que possible, le produit est déjà exposé ».

**Infrastructure réellement vérifiée** (CLI Vercel + `.env.local`, pas une déclaration) :
- Base de données (Supabase PostgreSQL) : **Irlande, UE** (`eu-west-1`) — confirmé.
- Calcul applicatif (Vercel, exécute chaque Server Action/route) : **États-Unis** (`iad1`,
  Virginie) — confirmé sur les 10 derniers déploiements de production ; aucun `vercel.json`, donc
  aucune région choisie explicitement, c'est le défaut de la plateforme. Ce point n'avait pas été
  identifié avant cette vérification technique — la réponse « hébergement UE » donnée plus tôt
  dans l'audit était donc incomplète (vraie pour la base, pas pour le calcul).
- Compte Vercel observé : organisation « chermann-kings-projects » (CLI authentifiée comme
  `chermann-king`). **Ne pas en déduire l'identité légale de l'éditeur** (nom de compte ≠
  entité juridique) — reste `[À COMPLÉTER]` par l'utilisateur, voir B4.

## Obligations

| ID | Obligation | Source | Statut de la règle | Confiance | Acteurs protégés | Verdict | Preuve | Gravité | Correctif / responsable | Échéance |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OBL-C4-GA-01 | Déclaration (ou autorisation si donnée sensible) préalable auprès de l'APDPVP | Loi gabonaise 025/2023 art. 78-81, 85 | En vigueur | Haute | Utilisateurs et tiers décrits gabonais | **Bloquant** | Aucune démarche engagée | Bloquant | Entité éditrice puis dépôt APDPVP — utilisateur | Avant tout lancement public au Gabon |
| OBL-C4-GA-02 | Droits, consentement, mineurs (autorisation parentale art. 74, 190), information (art. 98), registre, DPD, violations | Loi gabonaise 025/2023 art. 43-76, 98, 119-131, 142-147, 190 | En vigueur | Haute | Utilisateurs, tiers décrits, mineurs | Manquant | `docs/legal/drafts/privacy-policy.md` rédigé, mécanismes produits absents | Majeur | Claude (pages), utilisateur (mécanismes produit) | Avant publication de la politique de confidentialité |
| OBL-C4-GA-03 | Autorisation de transfert hors Gabon | Loi gabonaise 025/2023 art. 171-174 | En vigueur | Haute | Utilisateurs gabonais | **Bloquant** | Hébergement confirmé : base en UE, calcul aux États-Unis | Bloquant | Utilisateur (dépôt APDPVP) | Avant tout lancement public au Gabon |
| OBL-A1-RGPD-TRANSFER-US | Garantie de transfert UE→États-Unis (calcul Vercel, chapitre V RGPD) | RGPD art. 44-49 | En vigueur | Haute (fait vérifié), confiance basse sur la garantie applicable | Utilisateurs UE/diaspora | **À vérifier — nouveau** | `vercel inspect` : fonctions en `iad1` (États-Unis) sur 10/10 déploiements de production | Majeur | Utilisateur — vérifier l'adhésion de Vercel Inc. au EU-U.S. Data Privacy Framework ou l'existence de clauses contractuelles types | Avant publication de la politique de confidentialité § 4 |
| OBL-C4-GA-04 | Localisation/copie des données ; audit de sécurité | Loi gabonaise 027/2023 art. 34, 36 | En vigueur (portée ambiguë selon la source) | Moyenne-basse | Utilisateurs gabonais | À vérifier | — | À escalader | Avocat gabonais | Avant d'investir dans une infrastructure locale |
| OBL-C4-GA-05 | Réseaux sociaux/plateformes : identification, âge 16 ans, infos éditeur, signalement mineurs | Ordonnance gabonaise 0011/PR/2026 art. 4, 16-25, 29-34, 39-47 | **Force obligatoire non confirmée** (ratification non vérifiée) | Moyenne | Utilisateurs, mineurs | À vérifier | `docs/legal/drafts/terms-platform-ugc.md` anticipe ces exigences | À escalader | Avocat gabonais | ~avril 2027 si confirmée applicable |
| OBL-A1-RGPD-INFO | Information à la collecte (17 champs) | RGPD art. 12-14 | En vigueur | Haute | Utilisateurs UE, tiers décrits | Manquant | `docs/legal/drafts/privacy-policy.md` rédigé, non publié | Majeur | Claude (rédaction), utilisateur (identité, durées) | Avant publication |
| OBL-A1-RGPD-ART9 | Données sensibles (origine ethnique) : condition de l'art. 9(2) | RGPD art. 9 | En vigueur | Haute | Tiers décrits (tribu/clan/ethnicité) | À vérifier — base légale non arrêtée | `privacy-policy.md` § 9, `[CHOIX]` ouvert | Majeur | DPO/juriste puis utilisateur | Avant publication de la politique de confidentialité |
| OBL-A1-RGPD-DROITS | Droits des personnes (accès, rectification, effacement, portabilité) | RGPD art. 15-22 | En vigueur | Haute | Utilisateurs UE | Manquant — aucun mécanisme produit | `src/core/use-cases/` : aucun cas d'usage d'export/suppression trouvé | Majeur | Utilisateur (développement) | Avant publication de la politique de confidentialité § 6 |
| OBL-A1-CONSENT-PROOF | Conservation de la preuve du consentement (date, version acceptée) | Bonne pratique (DSA art. 14 ; RGPD art. 7(1)) | En vigueur | Haute | Utilisateurs | Manquant — décision volontaire | `src/app/actions/auth-actions.ts` : `ageConfirmed`/`termsAccepted` validés mais non persistés | Mineur (pour l'instant) | Utilisateur — nécessite une migration du schéma `User`, actuellement évitée : la base Supabase est encore partagée avec le legacy pendant la migration (ADR 0001/0005) | Avant un déploiement en production durable |
| OBL-A1-RGPD-28 | Contrats de sous-traitance (DPA) | RGPD art. 28 | En vigueur | Haute | Utilisateurs UE | À vérifier | `docs/legal/drafts/privacy-internal-docs.md` § B | Mineur (DPA standards généralement déjà proposés par Supabase/Vercel/Resend) | Utilisateur (vérifier acceptation) | Avant publication |
| OBL-A1-RGPD-33 | Notification de violation (72 h) | RGPD art. 33-34 | En vigueur | Haute | Utilisateurs UE | Manquant — procédure non formalisée | `docs/legal/drafts/privacy-internal-docs.md` § D | Majeur | Utilisateur | Avant publication |
| OBL-A1-RGPD-35 | AIPD si risque élevé | RGPD art. 35 | En vigueur | Haute | Tous | Manquant — déclencheurs présents (données sensibles + mineurs + exposition publique) | `docs/legal/drafts/privacy-internal-docs.md` § E | Majeur | Utilisateur/DPO | Avant ouverture publique élargie |
| OBL-DSA-14 | Règles de modération lisibles par machine | DSA art. 14 | En vigueur | Haute | Utilisateurs | Manquant | `docs/legal/drafts/terms-platform-ugc.md` § 4 rédigé | Majeur | Claude (rédaction) | Avant publication |
| OBL-DSA-11-12 | Point de contact unique (autorités + utilisateurs) | DSA art. 11-12 | En vigueur | Haute | Utilisateurs, autorités | Manquant | `terms-platform-ugc.md` § 7, `[À COMPLÉTER]` | Majeur | Utilisateur (coordonnées) | Avant publication |
| OBL-DSA-16-17 | Notification et action (signalement de contenu) | DSA art. 16-17 | En vigueur, s'applique **quelle que soit la taille** | Haute | Utilisateurs, tiers décrits | Manquant | `terms-platform-ugc.md` § 6 rédigé, mécanisme produit absent | Majeur | Utilisateur (développement) | Avant publication |
| OBL-DSA-24 | Transparence (destinataires actifs UE) | DSA art. 24 | En vigueur, applicable même aux micro/petites plateformes | Haute | Autorités | Non applicable pour l'instant (seuil de volume) | `terms-platform-ugc.md` § 10 | Mineur | — | Dès que le volume d'utilisateurs le justifie |
| OBL-IP-APACHE | Attribution et NOTICE des dépendances Apache-2.0 | Licences logicielles | En vigueur | Haute | — | À vérifier | `docs/legal/drafts/third-party-credits.md` | Mineur | Utilisateur/Claude (intégration) | Avant publication |

## Pages et documents légaux

| Document | Exigé par | Chemin/URL dans le projet | Langue(s) | Champs manquants | Verdict |
| --- | --- | --- | --- | --- | --- |
| Mentions légales | CDE XII.6 ; ordonnance gabonaise art. 25 (si applicable) | **Intégré** : `src/app/legal/mentions-legales/page.tsx` → `/legal/mentions-legales`, lié depuis tous les pieds de page | FR | Identité éditeur, hébergeurs (adresses), droit applicable | Intégré en dev, **non déployable en production** (`[À COMPLÉTER]` visibles) |
| Politique de confidentialité | RGPD art. 12-14 ; loi gabonaise art. 98 | **Intégré** : `src/app/legal/confidentialite/page.tsx` → `/legal/confidentialite`, lié depuis l'inscription et tous les pieds de page | FR | Identité responsable, durées de conservation, base légale données sensibles (§9) | Intégré en dev, **non déployable** (mécanisme droits absent + `[À COMPLÉTER]`) |
| CGU | DSA art. 14 ; ordonnance gabonaise art. 4, 16-17 | **Intégré** : `src/app/legal/cgu/page.tsx` → `/legal/cgu`, lié depuis l'inscription et tous les pieds de page | FR | Point de contact, droit applicable | Intégré en dev, **non déployable** (`[À COMPLÉTER]`, signalement non codé) |
| Crédits et licences tierces | Bonne pratique | **Intégré** : `src/app/legal/credits/page.tsx` → `/legal/credits` | FR | Identité éditeur (copyright), génération automatisée à mettre en place | Intégré en dev, publiable après automatisation de la liste et `[À COMPLÉTER]` |
| Documents internes RGPD (registre, DPA, procédures) | RGPD art. 28, 30, 33-35 | Brouillon : `docs/legal/drafts/privacy-internal-docs.md` (document interne, jamais publié) | FR | Identité responsable, durées, décisions produit | Brouillon interne |
| Dossier des formalités préalables (Gabon) | Loi gabonaise 025/2023 | Brouillon : `docs/legal/drafts/africa-prior-formalities.md` (document interne / dossier de dépôt, jamais publié tel quel sur le site) | FR | Identité éditeur, dates de dépôt, preuves | Brouillon — bloquant, voir § Formalités préalables |
| Page d'exercice des droits | RGPD art. 15-22 | Non créée — dépend du mécanisme produit (export/suppression) | — | Tout | Non commencée |
| Déclaration d'âge et acceptation des CGU/confidentialité à l'inscription | DSA art. 14 ; ordonnance gabonaise art. 16-17 | **Intégré** : deux cases à cocher requises (`src/presentation/components/forms/register-form.tsx`), non persistées en base — voir `OBL-A1-CONSENT-PROOF` | FR | Preuve datée de consentement non conservée (pas de migration de schéma, base Supabase partagée avec le legacy) | Intégré, partiel |
| Lien « Signaler un contenu » | DSA art. 16-17 | Non créé — mécanisme produit non développé | — | Tout | Non commencée |
| Politique cookies | ePrivacy / RGPD | Non nécessaire à ce jour (aucun traceur non essentiel) | — | — | Non applicable |
| Déclaration d'accessibilité | EAA (applicabilité non vérifiée) | Non créée | — | — | À auditer dans une prochaine passe |

## Décisions de l'éditeur

| Date | Sujet | Décision | Décideur |
| --- | --- | --- | --- |
| 2026-11-07 | Entité éditrice | Pas encore tranchée — brouillons avec `[À COMPLÉTER]` | Utilisateur |
| 2026-11-07 | Hébergement des données | Union européenne (Supabase/Vercel) | Utilisateur |
| 2026-11-07 | Diaspora UE/Belgique | Visée dès le lancement, pas différée | Utilisateur |
| 2026-11-07 | Âge minimum à l'inscription | Ajout d'une déclaration d'âge auto-déclarative (case à cocher, 16 ans) | Utilisateur |

## Formalités préalables
Voir `docs/legal/drafts/africa-prior-formalities.md` — 3 formalités au statut **À FAIRE**, bloquantes pour tout lancement public au Gabon (déclaration/autorisation APDPVP pour données sensibles, autorisation de transfert hors Gabon, représentant local).

## Hypothèses (`ASSUMPTION`) et questions ouvertes (`OPEN`)
- ~~`ASSUMPTION` : l'hébergement Supabase/Vercel est bien en région UE en production~~ — **vérifié techniquement le 2026-11-07**, partiellement exact : la base est en UE, le calcul applicatif est aux États-Unis (voir le constat ci-dessus).
- `OPEN` (nouveau 2026-11-07) : garantie de transfert UE→États-Unis applicable au calcul Vercel (adhésion au EU-U.S. Data Privacy Framework ou clauses contractuelles types) — non vérifiée, à documenter avant publication de la politique de confidentialité § 4.
- `OPEN` : identité de l'entité éditrice (bloque B1-B4 du rapport d'audit).
- `OPEN` : force obligatoire de l'ordonnance gabonaise 0011/PR/2026 (ratification non vérifiée).
- `OPEN` : portée exacte de l'art. 36 de la loi gabonaise 027/2023 (copie locale des données).
- `OPEN` : base légale exacte retenue pour le traitement des données sensibles (tribu/clan/ethnicité) sur des tiers non-utilisateurs — proposition en `privacy-policy.md` § 9, à valider par un DPO.
- `OPEN` : applicabilité de la législation européenne sur l'accessibilité numérique (EAA) à IFUMB — non auditée dans cette passe.
- `OPEN` (nouveau 2026-11-08) : couverture juridique pour les pays hors Gabon/Belgique-UE. L'utilisateur confirme qu'IFUMB sera accessible dans le monde entier (pas seulement au Gabon et à sa diaspora européenne). CGU et politique de confidentialité le disent désormais explicitement, avec un engagement à revoir la couverture pays par pays à mesure qu'une présence réelle d'utilisateurs y apparaît — pas d'audit des ~190 autres juridictions mené ni nécessaire à ce stade (aucun signal d'usage réel hors Gabon/UE détecté).
- `FACT` (2026-11-08) : comparaison avec Geneanet réalisée à partir des PDF fournis par l'utilisateur (`Politique de confidentialité - Geneanet.pdf`, `Conditions Générales d'Utilisation - Geneanet.pdf`, versions en vigueur 2021/revue 2023) — la lecture directe du site (`geneanet.org/legal/cgu/`, `/legal/privacy/`) avait échoué (HTTP 403, blocage anti-robots), contournée grâce aux fichiers locaux. Contenu lu intégralement, jamais copié : seules des pratiques génériques du secteur en sont tirées, reformulées avec les faits propres à IFUMB. Précédents concrets retenus :
  - **Base légale pour les données de tiers non-utilisateurs (arbres généalogiques)** : Geneanet s'appuie explicitement sur l'« intérêt légitime » pour le traitement des données d'arbres obtenues auprès de tiers — précédent sectoriel direct pour l'écart ouvert en § 9 de `privacy-policy.md`. Reste à faire valider par un DPO, mais ce n'est plus une question totalement ouverte.
  - **« Testament généalogique »** : Geneanet propose une déclaration de volonté du membre pour le devenir de son arbre après son décès (case à cocher + message aux héritiers), s'appuyant sur l'art. 85 de la loi Informatique et Libertés (directives post-mortem, droit français — non directement transposable au Gabon/Belgique, mais le concept l'est). IFUMB n'a aujourd'hui **aucun mécanisme** pour le décès du titulaire du compte (distinct de la personne décrite dans un arbre, déjà traitée) — écart produit à ajouter au registre, pas seulement juridique.
  - **Visibilité graduée des personnes vivantes** (« contemporains semi-masqués » / « contemporains privés ») : Geneanet masque sélectivement dates/photos/notes des vivants tout en gardant nom/filiation visibles. IFUMB n'a qu'une visibilité au niveau de l'arbre entier (`Tree.visibility`) plus un bouton `discoverable` par membre — pas de masquage sélectif par champ. Recommandation produit à évaluer, pas un correctif de cette passe.
  - **Distinction propriété** : les données restent la propriété du membre qui les publie ; seule la base/l'index agrégé peut faire l'objet d'un droit sui generis de producteur de base de données (droit distinct du droit d'auteur, art. L341-1 CPI) — confirme la rédaction déjà retenue en § 10 de `terms-platform-ugc.md` (compilation vs faits bruts).
  - **Engagement de non-commercialisation** explicite (« Geneanet s'engage à NE PAS VENDRE ») — déjà présent dans `privacy-policy.md` § 3 (« Aucune vente de données ») ; à répéter aussi dans les CGU pour plus de clarté.

## Échéances à surveiller

| Date | Règle | Statut | Action |
| --- | --- | --- | --- |
| Dès que possible | Dépôt APDPVP (déclaration + autorisation données sensibles + transfert) | À engager | Trancher l'entité éditrice, puis déposer |
| ~Avril 2027 (si l'ordonnance 0011/PR/2026 est confirmée applicable) | Vérification d'âge technique, marquage des contenus IA | Conditionnel | Revérifier la ratification avant cette date |
| 02-04-2027 | Nouveau règlement procédural RGPD (2025/2518) | À venir | Sans impact direct connu pour une structure de cette taille |

## Historique des audits

| Date | Verdict | Principaux changements |
| --- | --- | --- |
| 2026-11-07 | 🔴 Rouge (bloqueurs réels) | Premier audit. Brouillons rédigés dans `docs/legal/drafts/` (premier « go »). |
| 2026-11-07 | 🔴 Rouge (bloqueurs Gabon inchangés) | Second « go » : pages intégrées (`/legal/*`), liées depuis tous les pieds de page ; déclaration d'âge et acceptation des CGU/confidentialité ajoutées à l'inscription (non persistées, voir `OBL-A1-CONSENT-PROOF`) ; mécanisme de droits (export/suppression) et lien « Signaler » toujours absents — pages non déployables en production tant que les `[À COMPLÉTER]` restent visibles et que B1-B4 ne sont pas résolus. |
