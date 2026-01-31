import { contextBridge, ipcRenderer } from 'electron';

import { IPC_CHANNELS } from './shared/ipc';
import type { CardCrafterAPI } from './shared/types';

const api: CardCrafterAPI = {
  listDecks: () => ipcRenderer.invoke(IPC_CHANNELS.listDecks),
  createDeck: (input) => ipcRenderer.invoke(IPC_CHANNELS.createDeck, input),
  listCards: (deckId) => ipcRenderer.invoke(IPC_CHANNELS.listCards, deckId),
  createCard: (input) => ipcRenderer.invoke(IPC_CHANNELS.createCard, input),
  getDueCard: (deckId) => ipcRenderer.invoke(IPC_CHANNELS.getDueCard, deckId),
  reviewCard: (input) => ipcRenderer.invoke(IPC_CHANNELS.reviewCard, input),
  snoozeCard: (cardId, minutes) =>
    ipcRenderer.invoke(IPC_CHANNELS.snoozeCard, cardId, minutes),
  getStats: (deckId) => ipcRenderer.invoke(IPC_CHANNELS.getStats, deckId),
};

contextBridge.exposeInMainWorld('cardcrafter', api);
