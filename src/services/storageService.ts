/**
 * Servico para Firebase Storage - gerenciamento de arquivos (fotos de alunos).
 */

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTaskSnapshot,
} from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { alunoService } from './firestore';

export interface UploadProgress {
  progress: number;
  state: 'running' | 'paused' | 'success' | 'canceled' | 'error';
}

export interface UploadResult {
  url: string;
  path: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Valida o arquivo antes do upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Tipo de arquivo não permitido. Use JPG, PNG ou WebP.' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Arquivo muito grande. Tamanho máximo: 5MB.' };
  }
  return { valid: true };
}

/**
 * Faz upload da foto do aluno para o Firebase Storage
 */
export async function uploadAlunoPhoto(
  alunoId: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const extension = file.name.split('.').pop() || 'jpg';
  const path = `alunos/${alunoId}/foto.${extension}`;
  const storageRef = ref(storage, path);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        const state = snapshot.state as UploadProgress['state'];
        onProgress?.({ progress, state });
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          // Atualiza o aluno com a URL da foto
          await alunoService.update(alunoId, { fotoUrl: url });
          resolve({ url, path });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

/**
 * Remove a foto do aluno do Firebase Storage
 */
export async function deleteAlunoPhoto(alunoId: string, fotoUrl: string): Promise<void> {
  try {
    // Extrai o path da URL do Firebase Storage
    const urlParts = fotoUrl.split('/o/');
    if (urlParts.length < 2) {
      throw new Error('URL inválida');
    }
    const encodedPath = urlParts[1].split('?')[0];
    const path = decodeURIComponent(encodedPath);

    const storageRef = ref(storage, path);
    await deleteObject(storageRef);

    // Remove a URL do documento do aluno
    await alunoService.update(alunoId, { fotoUrl: '' });
  } catch (error: any) {
    // Se o arquivo não existe, apenas remove a referência
    if (error?.code === 'storage/object-not-found') {
      await alunoService.update(alunoId, { fotoUrl: '' });
      return;
    }
    throw error;
  }
}

/**
 * Busca a URL da foto do aluno (útil para refresh)
 */
export async function getAlunoPhotoUrl(alunoId: string): Promise<string | null> {
  try {
    // Tenta encontrar a foto com diferentes extensões
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];

    for (const ext of extensions) {
      try {
        const path = `alunos/${alunoId}/foto.${ext}`;
        const storageRef = ref(storage, path);
        const url = await getDownloadURL(storageRef);
        return url;
      } catch {
        // Continua para a próxima extensão
      }
    }

    return null;
  } catch {
    return null;
  }
}

export const storageService = {
  uploadAlunoPhoto,
  deleteAlunoPhoto,
  getAlunoPhotoUrl,
  validateImageFile,
};
