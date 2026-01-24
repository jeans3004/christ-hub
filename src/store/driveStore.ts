/**
 * Store para gerenciamento de estado do Google Drive.
 * Access token persistido em sessionStorage para sobreviver reloads.
 */

import { create } from 'zustand';
import { DriveFolderIds } from '@/types/drive';

const TOKEN_STORAGE_KEY = 'google_access_token';
const TOKEN_EXPIRES_KEY = 'google_token_expires';

// Helpers para sessionStorage
const saveTokenToStorage = (token: string, expiresAt: Date) => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    sessionStorage.setItem(TOKEN_EXPIRES_KEY, expiresAt.toISOString());
  }
};

const loadTokenFromStorage = (): { token: string | null; expiresAt: Date | null } => {
  if (typeof window === 'undefined') {
    return { token: null, expiresAt: null };
  }
  const token = sessionStorage.getItem(TOKEN_STORAGE_KEY);
  const expiresStr = sessionStorage.getItem(TOKEN_EXPIRES_KEY);
  const expiresAt = expiresStr ? new Date(expiresStr) : null;

  // Verificar se o token ainda e valido
  if (token && expiresAt && new Date() < expiresAt) {
    return { token, expiresAt };
  }

  // Token expirado ou inexistente
  clearTokenFromStorage();
  return { token: null, expiresAt: null };
};

const clearTokenFromStorage = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRES_KEY);
  }
};

interface DriveState {
  // Token de acesso (persistido em sessionStorage)
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
  loadStoredToken: () => boolean;
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
    saveTokenToStorage(token, expiresAt);
    set({
      accessToken: token,
      tokenExpiresAt: expiresAt,
    });
  },

  clearAccessToken: () => {
    clearTokenFromStorage();
    set({
      accessToken: null,
      tokenExpiresAt: null,
    });
  },

  loadStoredToken: () => {
    const { token, expiresAt } = loadTokenFromStorage();
    if (token && expiresAt) {
      set({
        accessToken: token,
        tokenExpiresAt: expiresAt,
      });
      return true;
    }
    return false;
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
    clearTokenFromStorage();
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
