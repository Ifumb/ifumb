import type { Alignment, Side } from 'driver.js'

type TourStep = Readonly<{
  target: string
  title: string
  description: string
  side: Side
  align: Alignment
}>

export const TOUR_STEPS = {
  dashboard: [
    {
      target: '#tour-btn-create-tree',
      title: 'Créer votre premier arbre',
      description: 'Cliquez ici pour démarrer votre premier réseau généalogique.',
      side: 'bottom',
      align: 'end',
    },
    {
      target: '#tour-tree-list',
      title: 'Vos arbres',
      description:
        'Tous vos arbres généalogiques apparaîtront ici. Vous pouvez en créer autant que vous le souhaitez.',
      side: 'top',
      align: 'center',
    },
  ],
  'tree-empty': [
    {
      target: '#tour-btn-add-member',
      title: 'Ajouter un membre',
      description: 'Commencez par ajouter la première personne de votre arbre.',
      side: 'bottom',
      align: 'start',
    },
    {
      target: '#tour-btn-add-union',
      title: 'Créer une union',
      description: 'Une union relie deux personnes et permet d’y rattacher des enfants.',
      side: 'bottom',
      align: 'start',
    },
    {
      target: '#tour-btn-filters',
      title: 'Filtres',
      description: 'Affinez l’affichage de votre graphe selon les générations ou les membres.',
      side: 'left',
      align: 'start',
    },
  ],
  'tree-with-members': [
    {
      target: '#tour-btn-kinship',
      title: 'Chemin relationnel',
      description: 'Trouvez le lien de parenté entre deux membres de l’arbre.',
      side: 'left',
      align: 'start',
    },
    {
      target: '#tour-btn-ancestors',
      title: 'Ancêtres communs',
      description: 'Identifiez les ancêtres partagés entre deux membres.',
      side: 'left',
      align: 'start',
    },
    {
      target: '#tour-btn-connections',
      title: 'Connexions inter-arbres',
      description:
        'Connectez votre arbre à celui d’un autre utilisateur pour découvrir des liens familiaux insoupçonnés.',
      side: 'left',
      align: 'start',
    },
  ],
  'tree-cross-tree': [
    {
      target: '[data-tour-member="bridge"]',
      title: 'Membre-pont',
      description:
        'Ce membre existe dans un autre arbre connecté. Cliquez sur ↗ pour afficher sa famille dans l’autre arbre.',
      side: 'bottom',
      align: 'center',
    },
    {
      target: '[data-tour-member="foreign"]',
      title: 'Membre étranger',
      description:
        'Ces membres en bleu appartiennent à l’arbre connecté. Ils sont visibles mais non modifiables.',
      side: 'bottom',
      align: 'center',
    },
  ],
} as const satisfies Record<string, readonly TourStep[]>

export type TourId = keyof typeof TOUR_STEPS
