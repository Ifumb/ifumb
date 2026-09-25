import type { ComponentPropsWithoutRef } from 'react'

const PATHS = {
  copy: 'M9 9h12v12H9ZM15 9V3H3v12h6',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
  key: 'M15 3a6 6 0 0 0-5 9L3 19v3h4v-3h3v-3l2-2a6 6 0 1 0 3-11Z',
  logout: 'M9 4H4v16h5M13 8l4 4-4 4M8 12h13',
  plus: 'M12 5v14M5 12h14',
  close: 'm6 6 12 12M6 18 18 6',
  back: 'm14 6-6 6 6 6',
  next: 'm10 6 6 6-6 6',
  people:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M18 8a3 3 0 0 1 0 6M22 21v-2a4 4 0 0 0-3-4',
  edit: 'm16 3 5 5-12 12-6 1 1-6ZM14 5l5 5',
  lock: 'M5 10h14v11H5ZM8 10V6a4 4 0 0 1 8 0v4',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M2 12h20M12 2c-6 6-6 14 0 20 6-6 6-14 0-20',
  history: 'M3 3v6h6M3 9a9 9 0 1 1 0 6M12 7v5l3 2',
  branch: 'M6 3v12a5 5 0 0 0 10 0V9M3 3h6M13 6h6v3h-6M3 19h6',
  search: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14m5 12 6 6',
  menu: 'M4 6h16M4 12h16M4 18h16',
  help: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M9 8a3 3 0 0 1 6 0c0 3-3 2-3 6M12 17v1',
  map: 'm3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2ZM9 3v16M15 5v16',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, ...props }: ComponentPropsWithoutRef<'svg'> & { name: IconName }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
