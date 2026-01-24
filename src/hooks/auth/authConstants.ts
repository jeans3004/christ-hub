/**
 * Constantes de autenticacao.
 */

import { GoogleAuthProvider } from 'firebase/auth';

export const googleProvider = new GoogleAuthProvider();

// Adicionar escopo do Google Drive (acesso completo para Shared Drives)
// Necessario para acessar pastas existentes no Drive Compartilhado
googleProvider.addScope('https://www.googleapis.com/auth/drive');

// Escopos do Google Classroom (leitura)
googleProvider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/classroom.rosters.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/classroom.coursework.students.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/classroom.announcements.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/classroom.topics.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly');

// Escopos de escrita do Google Classroom
googleProvider.addScope('https://www.googleapis.com/auth/classroom.announcements');
googleProvider.addScope('https://www.googleapis.com/auth/classroom.coursework.students');
googleProvider.addScope('https://www.googleapis.com/auth/classroom.topics');
googleProvider.addScope('https://www.googleapis.com/auth/classroom.rosters'); // Convidar/remover professores e alunos

// Escopos de perfil do Google Classroom (para ver email e foto dos usuarios)
googleProvider.addScope('https://www.googleapis.com/auth/classroom.profile.emails');
googleProvider.addScope('https://www.googleapis.com/auth/classroom.profile.photos');

// Forcar selecao de conta e consent para garantir novos scopes
googleProvider.setCustomParameters({
  prompt: 'select_account consent',
  hd: 'christmaster.com.br', // Hosted domain - so mostra contas desse dominio
  access_type: 'offline', // Permite refresh token
});

// Escopos do Drive
export const DRIVE_SCOPES = {
  FULL: 'https://www.googleapis.com/auth/drive',
  FILE: 'https://www.googleapis.com/auth/drive.file',
} as const;

// Demo mode - set to true to bypass Firebase auth
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
