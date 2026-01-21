/**
 * Constantes de autenticacao.
 */

import { GoogleAuthProvider } from 'firebase/auth';

export const googleProvider = new GoogleAuthProvider();

// Adicionar escopo do Google Drive (apenas arquivos criados pelo app)
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

// Forcar consent para obter refresh token
googleProvider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline',
});

// Escopos do Drive
export const DRIVE_SCOPES = {
  FILE: 'https://www.googleapis.com/auth/drive.file',
} as const;

// Demo mode - set to true to bypass Firebase auth
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
