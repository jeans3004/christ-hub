/**
 * Tipos para integracao com Google Drive.
 */

// Arquivo do Google Drive
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string;
  size?: number;
  createdTime: Date;
  modifiedTime?: Date;
  parents?: string[];
}

// Opcoes de upload
export interface DriveUploadOptions {
  file: File;
  folderId: string;
  fileName?: string;
  description?: string;
  onProgress?: (progress: number) => void;
}

// Resultado de upload
export interface DriveUploadResult {
  success: boolean;
  file?: DriveFile;
  error?: string;
}

// Anexo de ocorrencia (armazenado no Firestore)
export interface OcorrenciaAnexo {
  id: string;
  driveFileId: string;
  fileName: string;
  mimeType: string;
  size: number;
  webViewLink: string;
  thumbnailLink?: string;
  uploadedAt: Date;
  uploadedBy: string;
}

// Estrutura de pastas do Drive
// Hierarquia: SGE_NOVO (existente) > SGE Diário Digital > subpastas
export const DRIVE_FOLDERS = {
  PARENT: 'SGE_NOVO',           // Pasta pai existente no Shared Drive
  ROOT: 'SGE Diário Digital',
  DOCUMENTOS: 'Documentos',
  COMUNICADOS: 'Comunicados',
  ATAS: 'Atas',
  RELATORIOS: 'Relatórios',
  ANEXOS: 'Anexos',
  OCORRENCIAS: 'Ocorrencias',
  MENSAGENS: 'Mensagens',
  FOTOS: 'Fotos',
  ALUNOS: 'Alunos',
  BACKUPS: 'Backups',
  EXPORTS: 'Exports',
} as const;

export type DriveFolderKey = keyof typeof DRIVE_FOLDERS;

// IDs das pastas (populado apos inicializacao)
export type DriveFolderIds = Record<string, string>;

// Configuracao do Drive
export interface DriveConfig {
  accessToken: string;
  rootFolderId?: string;
}

// Resposta da API do Google Drive
export interface DriveApiResponse<T> {
  kind?: string;
  files?: T[];
  nextPageToken?: string;
}

// Metadados de arquivo para criacao
export interface DriveFileMetadata {
  name: string;
  mimeType?: string;
  parents?: string[];
  description?: string;
}

// Tipos MIME suportados
export const DRIVE_MIME_TYPES = {
  FOLDER: 'application/vnd.google-apps.folder',
  PDF: 'application/pdf',
  DOC: 'application/msword',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLS: 'application/vnd.ms-excel',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  JPG: 'image/jpeg',
  PNG: 'image/png',
  GIF: 'image/gif',
  MP3: 'audio/mpeg',
  MP4: 'video/mp4',
} as const;

// Limites de tamanho (em bytes)
export const DRIVE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024,      // 10MB
  DOCUMENT: 25 * 1024 * 1024,   // 25MB
  AUDIO: 16 * 1024 * 1024,      // 16MB
  VIDEO: 50 * 1024 * 1024,      // 50MB
  DEFAULT: 25 * 1024 * 1024,    // 25MB
} as const;

// Estado do upload
export interface DriveUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  currentFile: string | null;
}

// Item da fila offline
export interface DriveQueuedUpload {
  id: string;
  fileData: ArrayBuffer;
  fileName: string;
  mimeType: string;
  targetFolderId: string;
  createdAt: Date;
  attempts: number;
  lastError?: string;
}
