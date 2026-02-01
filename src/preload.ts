import { contextBridge, ipcRenderer } from 'electron';

import { IPC_CHANNELS } from './shared/ipc';
import type { CardCrafterAPI } from './shared/types';

const api: CardCrafterAPI = {
  listDecks: () => ipcRenderer.invoke(IPC_CHANNELS.listDecks),
  createDeck: (input) => ipcRenderer.invoke(IPC_CHANNELS.createDeck, input),
  listCards: (deckId) => ipcRenderer.invoke(IPC_CHANNELS.listCards, deckId),
  createCard: (input) => ipcRenderer.invoke(IPC_CHANNELS.createCard, input),
  updateCard: (input) => ipcRenderer.invoke(IPC_CHANNELS.updateCard, input),
  getDueCard: (deckId) => ipcRenderer.invoke(IPC_CHANNELS.getDueCard, deckId),
  reviewCard: (input) => ipcRenderer.invoke(IPC_CHANNELS.reviewCard, input),
  snoozeCard: (cardId, minutes) =>
    ipcRenderer.invoke(IPC_CHANNELS.snoozeCard, cardId, minutes),
  getStats: (deckId) => ipcRenderer.invoke(IPC_CHANNELS.getStats, deckId),
  startReviewSession: (deckId) =>
    ipcRenderer.invoke(IPC_CHANNELS.startReviewSession, deckId),
  endReviewSession: (sessionId) =>
    ipcRenderer.invoke(IPC_CHANNELS.endReviewSession, sessionId),
  getNextReviewInfo: (deckId) =>
    ipcRenderer.invoke(IPC_CHANNELS.getNextReviewInfo, deckId),
  getDueCardWithPriority: (deckId, poorCardIds) =>
    ipcRenderer.invoke(IPC_CHANNELS.getDueCardWithPriority, deckId, poorCardIds),
  moveDeck: (input) => ipcRenderer.invoke(IPC_CHANNELS.moveDeck, input),
  deleteDeck: (input) => ipcRenderer.invoke(IPC_CHANNELS.deleteDeck, input),
  getDeletePreview: (deckId) =>
    ipcRenderer.invoke(IPC_CHANNELS.getDeletePreview, deckId),
};

contextBridge.exposeInMainWorld('cardcrafter', api);
