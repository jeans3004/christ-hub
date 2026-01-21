/**
 * Constantes de autenticacao.
 */

import { GoogleAuthProvider } from 'firebase/auth';

export const googleProvider = new GoogleAuthProvider();

// Adicionar escopo do Google Drive (acesso completo para Shared Drives)
// Necessário para acessar pastas existentes no Drive Compartilhado
googleProvider.addScope('https://www.googleapis.com/auth/drive');

// Forcar consent para obter refresh token
googleProvider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline',
});

// Escopos do Drive
export const DRIVE_SCOPES = {
  FULL: 'https://www.googleapis.com/auth/drive',
  FILE: 'https://www.googleapis.com/auth/drive.file',
} as const;

// Demo mode - set to true to bypass Firebase auth
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
