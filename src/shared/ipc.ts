export const IPC_CHANNELS = {
  listDecks: 'decks:list',
  createDeck: 'decks:create',
  listCards: 'cards:list',
  createCard: 'cards:create',
  getDueCard: 'review:next',
  reviewCard: 'review:rate',
  snoozeCard: 'review:snooze',
  getStats: 'stats:get',
} as const;
