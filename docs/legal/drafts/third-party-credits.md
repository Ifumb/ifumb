<!-- BROUILLON À FAIRE VALIDER PAR UN JURISTE — conventions : assets/templates/README.md (skill `legal`) -->
<!-- Source : propriété intellectuelle/licences tierces (UE/Belgique). À afficher dans l'application (écran « À propos / Licences ») et en pied de page. -->
<!-- Inventaire généré le 2026-11-07 avec `pnpm licenses list --prod` (84 dépendances de production). Aucune licence copyleft forte (GPL/AGPL/SSPL/BUSL), aucune licence non-commerciale (CC-NC), aucune licence manquante/« UNKNOWN » détectée : risque faible. -->

# Crédits et licences tierces

## Composants logiciels — résumé par licence
IFUMB est construit avec des composants open source. Liste complète générée automatiquement le 2026-11-07 :

| Licence (SPDX) | Nombre de composants | Exemples |
| --- | --- | --- |
| MIT | 54 | React, Next.js, Zod, `@xyflow/react` (React Flow), `@dagrejs/dagre`, Resend SDK, `driver.js`, `lucide-react`... |
| ISC | 14 | `next-auth`, `@auth/core`, famille `d3-*` (d3-color, d3-drag, d3-selection...), `semver`, `picocolors`... |
| Apache-2.0 | 8 | `@prisma/client`, `@prisma/adapter-pg` et les autres paquets `@prisma/*`, `sharp`, `@swc/helpers`, `detect-libc`, `baseline-browser-mapping` |
| BSD-3-Clause | 3 | `bcryptjs`, `source-map-js`, `d3-ease` |
| 0BSD | 1 | `tslib` |
| MIT-0 | 1 | `postal-mime` |
| Unlicense | 1 | `fast-sha256` |
| CC-BY-4.0 | 1 | `caniuse-lite` (donnée de compatibilité navigateur, utilisée uniquement au moment de la compilation — non distribuée à l'utilisateur final) |

**[À COMPLÉTER : automatiser]** — cette liste regroupée par licence est une photographie manuelle au 2026-11-07. Elle se périme à chaque `pnpm add`/mise à jour de dépendance. **Recommandation d'intégration** : générer la page `/legal/credits` à partir de `pnpm licenses list --json` (ou un outil d'inventaire équivalent) au moment du build, plutôt que de maintenir ce tableau à la main — voir le plan d'intégration.

### Composants sous Apache-2.0 (fichier NOTICE à vérifier)
La licence Apache-2.0 impose de reproduire le contenu d'un éventuel fichier `NOTICE` du composant. À vérifier pour : `@prisma/client`, `@prisma/adapter-pg`, `@prisma/client-runtime-utils`, `@prisma/debug`, `@prisma/driver-adapter-utils`, `sharp`, `@swc/helpers`, `detect-libc`, `baseline-browser-mapping`. [À COMPLÉTER : résultat de la vérification].

### Texte intégral des licences
Le texte complet de chaque licence doit être accessible depuis la page `/legal/credits` (lien stable vers le dépôt du composant, ou texte livré avec l'application). [À COMPLÉTER : génération automatique recommandée, voir ci-dessus].

## Données et cartes
IFUMB n'utilise aujourd'hui aucun fournisseur de cartes ni de données géographiques tierces (aucune dépendance de cartographie détectée). Sans objet pour l'instant — à revoir si une fonctionnalité de carte est ajoutée.

## Polices, icônes, images, audio
- Icônes : `lucide-react` (licence ISC, incluse dans le tableau ci-dessus).
- Police éditoriale (titres de la landing page) : Georgia / Times New Roman — polices système, aucune distribution ni téléchargement, aucune attribution requise.
- Aucune image, police ou média sous licence Creative Commons nécessitant une attribution distincte n'a été identifié dans le dépôt. [À COMPLÉTER : revérifier si des médias sont ajoutés (ex. illustrations de la landing page)].

## Mentions et réserves
- © [À COMPLÉTER : année] [À COMPLÉTER : entité]. Marque « IFUMB » : [À COMPLÉTER].
- **Réserve d'exploration de textes et de données (fouille de TDM / entraînement d'IA)** : les arbres publics (`/explore`) exposent du contenu en ligne. Une clause des CGU seule ne suffit pas à réserver ce droit pour un contenu public — un procédé lisible par machine est recommandé (`robots.txt`, `tdmrep.json`, ou en-tête HTTP dédié). [CHOIX : à arbitrer avant l'ouverture large d'`/explore` à l'indexation].
