/**
 * Hook para gerenciamento de foto do aluno.
 */

import { useState, useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';
import {
  uploadAlunoPhoto,
  deleteAlunoPhoto,
  validateImageFile,
  UploadProgress,
} from '@/services/storageService';

interface UseStudentPhotoReturn {
  uploading: boolean;
  progress: number;
  error: string | null;
  uploadPhoto: (alunoId: string, file: File) => Promise<string | null>;
  deletePhoto: (alunoId: string, fotoUrl: string) => Promise<boolean>;
  validateFile: (file: File) => { valid: boolean; error?: string };
  resetState: () => void;
}

export function useStudentPhoto(): UseStudentPhotoReturn {
  const { addToast } = useUIStore();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleProgress = useCallback((uploadProgress: UploadProgress) => {
    setProgress(uploadProgress.progress);
  }, []);

  const uploadPhoto = useCallback(
    async (alunoId: string, file: File): Promise<string | null> => {
      // Validar arquivo
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Arquivo inválido');
        addToast(validation.error || 'Arquivo inválido', 'error');
        return null;
      }

      setUploading(true);
      setProgress(0);
      setError(null);

      try {
        const result = await uploadAlunoPhoto(alunoId, file, handleProgress);
        addToast('Foto atualizada com sucesso!', 'success');
        return result.url;
      } catch (err: any) {
        const errorMessage = err?.message || 'Erro ao fazer upload da foto';
        setError(errorMessage);
        addToast(errorMessage, 'error');
        return null;
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [addToast, handleProgress]
  );

  const deletePhoto = useCallback(
    async (alunoId: string, fotoUrl: string): Promise<boolean> => {
      setUploading(true);
      setError(null);

      try {
        await deleteAlunoPhoto(alunoId, fotoUrl);
        addToast('Foto removida com sucesso!', 'success');
        return true;
      } catch (err: any) {
        const errorMessage = err?.message || 'Erro ao remover foto';
        setError(errorMessage);
        addToast(errorMessage, 'error');
        return false;
      } finally {
        setUploading(false);
      }
    },
    [addToast]
  );

  const validateFile = useCallback((file: File) => {
    return validateImageFile(file);
  }, []);

  const resetState = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  return {
    uploading,
    progress,
    error,
    uploadPhoto,
    deletePhoto,
    validateFile,
    resetState,
  };
}
