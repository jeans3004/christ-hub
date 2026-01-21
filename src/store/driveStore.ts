/**
 * Store para gerenciamento de estado do Google Drive.
 * Access token mantido apenas em memoria (nao persiste).
 */

import { create } from 'zustand';
import { DriveFolderIds } from '@/types/drive';

interface DriveState {
  // Token de acesso (em memoria apenas, nao persiste)
  accessToken: string | null;
  tokenExpiresAt: Date | null;

  // IDs das pastas criadas no Drive
  folderIds: DriveFolderIds | null;

  // Status
  isInitialized: boolean;
  isInitializing: boolean;
  pendingUploads: number;

  // Acoes
  setAccessToken: (token: string, expiresInSeconds: number) => void;
  clearAccessToken: () => void;
  setFolderIds: (ids: DriveFolderIds) => void;
  setInitializing: (initializing: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  incrementPendingUploads: () => void;
  decrementPendingUploads: () => void;
  reset: () => void;

  // Helpers
  isTokenValid: () => boolean;
  getAccessToken: () => string | null;
}

export const useDriveStore = create<DriveState>()((set, get) => ({
  // Estado inicial
  accessToken: null,
  tokenExpiresAt: null,
  folderIds: null,
  isInitialized: false,
  isInitializing: false,
  pendingUploads: 0,

  // Acoes
  setAccessToken: (token, expiresInSeconds) => {
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    set({
      accessToken: token,
      tokenExpiresAt: expiresAt,
    });
  },

  clearAccessToken: () => {
    set({
      accessToken: null,
      tokenExpiresAt: null,
    });
  },

  setFolderIds: (ids) => {
    set({ folderIds: ids });
  },

  setInitializing: (initializing) => {
    set({ isInitializing: initializing });
  },

  setInitialized: (initialized) => {
    set({ isInitialized: initialized, isInitializing: false });
  },

  incrementPendingUploads: () => {
    set((state) => ({ pendingUploads: state.pendingUploads + 1 }));
  },

  decrementPendingUploads: () => {
    set((state) => ({ pendingUploads: Math.max(0, state.pendingUploads - 1) }));
  },

  reset: () => {
    set({
      accessToken: null,
      tokenExpiresAt: null,
      folderIds: null,
      isInitialized: false,
      isInitializing: false,
      pendingUploads: 0,
    });
  },

  // Helpers
  isTokenValid: () => {
    const { accessToken, tokenExpiresAt } = get();
    if (!accessToken || !tokenExpiresAt) return false;
    // Considera invalido se expira em menos de 5 minutos
    return new Date() < new Date(tokenExpiresAt.getTime() - 5 * 60 * 1000);
  },

  getAccessToken: () => {
    const state = get();
    if (state.isTokenValid()) {
      return state.accessToken;
    }
    return null;
  },
}));
