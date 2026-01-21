/**
 * Hook para gerenciamento de foto do aluno.
 * Usa Google Drive (Shared Drive) para armazenamento.
 */

import { useState, useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useDriveStore } from '@/store/driveStore';
import {
  createDriveService,
  uploadAlunoPhotoDrive,
  deleteAlunoPhotoDrive,
} from '@/services/driveService';
import { validateImageFile, resizeImage } from '@/services/storageService';
import { alunoService } from '@/services/firestore';

interface UseStudentPhotoReturn {
  uploading: boolean;
  progress: number;
  error: string | null;
  uploadPhoto: (alunoId: string, file: File) => Promise<string | null>;
  deletePhoto: (alunoId: string, fotoUrl: string) => Promise<boolean>;
  validateFile: (file: File) => { valid: boolean; error?: string };
  resetState: () => void;
  isDriveConnected: boolean;
}

export function useStudentPhoto(): UseStudentPhotoReturn {
  const { addToast } = useUIStore();
  const { accessToken, folderIds, isTokenValid } = useDriveStore();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isDriveConnected = !!(accessToken && isTokenValid() && folderIds?.ALUNOS);

  const uploadPhoto = useCallback(
    async (alunoId: string, file: File): Promise<string | null> => {
      // Validar arquivo
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Arquivo inválido');
        addToast(validation.error || 'Arquivo inválido', 'error');
        return null;
      }

      // Verificar se Drive está conectado
      if (!isDriveConnected || !accessToken || !folderIds) {
        const errorMessage = 'Google Drive não está conectado. Faça login novamente.';
        setError(errorMessage);
        addToast(errorMessage, 'error');
        return null;
      }

      setUploading(true);
      setProgress(0);
      setError(null);

      try {
        // Redimensionar imagem antes do upload
        let uploadFile: File;
        try {
          const resizedBlob = await resizeImage(file);
          uploadFile = new File([resizedBlob], `${alunoId}.jpg`, { type: 'image/jpeg' });
        } catch {
          // Se falhar o redimensionamento, usa o arquivo original
          console.warn('Falha ao redimensionar, usando original');
          uploadFile = file;
        }

        // Criar serviço do Drive
        const service = createDriveService(accessToken);

        // Fazer upload para o Drive
        const result = await uploadAlunoPhotoDrive(
          service,
          folderIds,
          alunoId,
          uploadFile,
          setProgress
        );

        if (!result.success || !result.file) {
          throw new Error(result.error || 'Erro ao fazer upload');
        }

        // Tornar arquivo público para exibição
        try {
          await service.setPublicAccess(result.file.id);
        } catch (e) {
          console.warn('Não foi possível tornar a foto pública:', e);
        }

        // URL embeddable para exibir a imagem (não webViewLink que é para visualização)
        // Formato: https://drive.google.com/thumbnail?id=FILE_ID&sz=w400
        const photoUrl = `https://drive.google.com/thumbnail?id=${result.file.id}&sz=w400`;

        // Atualizar o aluno com a URL da foto
        await alunoService.update(alunoId, { fotoUrl: photoUrl });

        addToast('Foto atualizada com sucesso!', 'success');
        return photoUrl;
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
    [addToast, isDriveConnected, accessToken, folderIds]
  );

  const deletePhoto = useCallback(
    async (alunoId: string, fotoUrl: string): Promise<boolean> => {
      // Verificar se Drive está conectado
      if (!isDriveConnected || !accessToken || !folderIds) {
        const errorMessage = 'Google Drive não está conectado. Faça login novamente.';
        setError(errorMessage);
        addToast(errorMessage, 'error');
        return false;
      }

      setUploading(true);
      setError(null);

      try {
        // Criar serviço do Drive
        const service = createDriveService(accessToken);

        // Deletar foto do Drive
        await deleteAlunoPhotoDrive(service, folderIds, alunoId);

        // Remover URL do documento do aluno
        await alunoService.update(alunoId, { fotoUrl: '' });

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
    [addToast, isDriveConnected, accessToken, folderIds]
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
    isDriveConnected,
  };
}
