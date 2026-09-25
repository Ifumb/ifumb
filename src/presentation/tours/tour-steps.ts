type TourStep = Readonly<{ target: string; title: string; description: string }>

const TREE_TOOLS: readonly TourStep[] = [
  {
    target: '#tour-btn-filters',
    title: 'Filtres',
    description:
      'Affinez l’affichage du graphe selon les générations, le genre et la culture des membres.',
  },
  {
    target: '#tour-btn-kinship',
    title: 'Chemin relationnel',
    description: 'Trouvez le lien de parenté entre deux membres de l’arbre.',
  },
  {
    target: '#tour-btn-ancestors',
    title: 'Ancêtres communs',
    description: 'Identifiez les ancêtres partagés entre deux membres.',
  },
  {
    target: '#tour-btn-connections',
    title: 'Connexions inter-arbres',
    description:
      'Consultez les liens familiaux avec d’autres arbres. Les branches connectées restent en lecture seule.',
  },
]

export const TOUR_STEPS = {
  dashboard: [
    {
      target: '#tour-btn-create-tree',
      title: 'Créer votre premier arbre',
      description: 'Cliquez sur Créer pour démarrer votre réseau généalogique.',
    },
    {
      target: '#tour-tree-list',
      title: 'Vos arbres',
      description:
        'Vos arbres et ceux qui vous sont partagés apparaissent ici. Cliquez sur une carte pour ouvrir son graphe.',
    },
  ],
  'tree-empty': [
    {
      target: '#tour-btn-add-member',
      title: 'Ajouter un membre',
      description: 'Commencez par ajouter la première personne de votre arbre.',
    },
    {
      target: '#tour-btn-add-union',
      title: 'Créer une union',
      description:
        'Une union relie les parents et permet d’y rattacher des enfants. Les propositions d’un éditeur sont soumises au propriétaire.',
    },
    ...TREE_TOOLS,
  ],
  'tree-with-members': TREE_TOOLS,
} as const satisfies Record<string, readonly TourStep[]>

export type TourId = keyof typeof TOUR_STEPS
