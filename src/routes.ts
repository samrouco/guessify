export const ROUTES = {
  LANDING: '/',
  SELECTION: '/selection',
  SEARCH: '/search',
  GAME: '/game',
  RESULTS: '/results',
  TIERLIST_SELECTION: '/tierlist',
  TIERLIST_SEARCH: '/tierlist/search',
  TIERLIST_GAME: '/tierlist/game',
  TIERLIST_RESULTS: '/tierlist/results',
} as const;

export type RoutePath = typeof ROUTES[keyof typeof ROUTES];