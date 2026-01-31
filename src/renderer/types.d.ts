import type { CardCrafterAPI } from '../shared/types';

declare global {
  interface Window {
    cardcrafter: CardCrafterAPI;
  }
}

export {};
