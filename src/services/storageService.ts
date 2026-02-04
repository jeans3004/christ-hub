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
const MAX_IMAGE_DIMENSION = 400; // Dimensao maxima para fotos de perfil
const JPEG_QUALITY = 0.85; // Qualidade JPEG (0-1)

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
 * Redimensiona uma imagem mantendo a proporcao
 * Retorna um Blob no formato JPEG
 */
export async function resizeImage(
  file: File,
  maxDimension: number = MAX_IMAGE_DIMENSION
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Erro ao criar canvas'));
      return;
    }

    img.onload = () => {
      let { width, height } = img;

      // Calcula nova dimensao mantendo proporcao
      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Desenha a imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height);

      // Converte para JPEG blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Erro ao converter imagem'));
          }
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      reject(new Error('Erro ao carregar imagem'));
    };

    // Carrega a imagem do arquivo
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Faz upload da foto do aluno para o Firebase Storage
 * Redimensiona automaticamente para otimizar armazenamento
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

  // Redimensiona a imagem antes do upload
  let uploadData: Blob;
  try {
    onProgress?.({ progress: 0, state: 'running' });
    uploadData = await resizeImage(file);
  } catch (error) {
    // Se falhar o redimensionamento, usa o arquivo original
    console.warn('Falha ao redimensionar, usando original:', error);
    uploadData = file;
  }

  // Sempre usa extensao .jpg pois convertemos para JPEG
  const path = `alunos/${alunoId}/foto.jpg`;
  const storageRef = ref(storage, path);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, uploadData);

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

/**
 * Valida arquivo de atestado (PDF ou imagem)
 */
const ATESTADO_ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const ATESTADO_MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function validateAtestadoFile(file: File): { valid: boolean; error?: string } {
  if (!ATESTADO_ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Tipo de arquivo nao permitido. Use PDF, JPG, PNG ou WebP.' };
  }
  if (file.size > ATESTADO_MAX_SIZE) {
    return { valid: false, error: 'Arquivo muito grande. Tamanho maximo: 10MB.' };
  }
  return { valid: true };
}

/**
 * Faz upload de arquivo de atestado para o Firebase Storage
 */
export async function uploadAtestadoFile(
  atestadoId: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const validation = validateAtestadoFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const extension = file.name.split('.').pop() || 'pdf';
  const path = `atestados/${atestadoId}/arquivo.${extension}`;
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
          resolve({ url, path });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

/**
 * Remove arquivo de atestado do Firebase Storage
 */
export async function deleteAtestadoFile(arquivoUrl: string): Promise<void> {
  try {
    const urlParts = arquivoUrl.split('/o/');
    if (urlParts.length < 2) {
      throw new Error('URL invalida');
    }
    const encodedPath = urlParts[1].split('?')[0];
    const path = decodeURIComponent(encodedPath);

    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error: any) {
    if (error?.code === 'storage/object-not-found') {
      return;
    }
    throw error;
  }
}

export const storageService = {
  uploadAlunoPhoto,
  deleteAlunoPhoto,
  getAlunoPhotoUrl,
  validateImageFile,
  resizeImage,
  uploadAtestadoFile,
  deleteAtestadoFile,
  validateAtestadoFile,
};
