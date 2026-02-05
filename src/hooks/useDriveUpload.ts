/**
 * Hook para upload de arquivos no Google Drive.
 * Inclui rastreamento de progresso e tratamento de erros.
 */

'use client';

import { useState, useCallback } from 'react';
import { useDriveStore } from '@/store/driveStore';
import { useUIStore } from '@/store/uiStore';
import {
  createDriveService,
  getOcorrenciasFolderForYear,
  getMensagensFolderForMonth,
} from '@/services/driveService';
import { DriveFile, DriveUploadState, DriveFolderIds } from '@/types/drive';

export type DriveTargetFolder = 'OCORRENCIAS' | 'MENSAGENS' | 'EXPORTS' | 'COMUNICADOS' | 'ATESTADOS';

interface UseDriveUploadOptions {
  // Para pastas com subpastas por ano/mes
  ano?: number;
  mes?: number;
}

interface UseDriveUploadReturn {
  upload: (file: File, targetFolder: DriveTargetFolder, options?: UseDriveUploadOptions) => Promise<DriveFile | null>;
  uploadMultiple: (files: File[], targetFolder: DriveTargetFolder, options?: UseDriveUploadOptions) => Promise<DriveFile[]>;
  uploadState: DriveUploadState;
  isConnected: boolean;
  initializeDrive: () => Promise<boolean>;
  cancelUpload: () => void;
}

export function useDriveUpload(): UseDriveUploadReturn {
  const { addToast } = useUIStore();
  const {
    accessToken,
    folderIds,
    isInitialized,
    isInitializing,
    setFolderIds,
    setInitializing,
    setInitialized,
    incrementPendingUploads,
    decrementPendingUploads,
    isTokenValid,
  } = useDriveStore();

  const [uploadState, setUploadState] = useState<DriveUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    currentFile: null,
  });

  const [abortController, setAbortController] = useState<AbortController | null>(null);

  /**
   * Verifica se o Drive esta conectado e pronto.
   */
  const isConnected = isTokenValid() && isInitialized && !!folderIds;

  /**
   * Inicializa a estrutura de pastas do Drive.
   */
  const initializeDrive = useCallback(async (): Promise<boolean> => {
    if (!accessToken) {
      addToast('Faça login com Google para usar o Drive', 'warning');
      return false;
    }

    if (isInitialized && folderIds) {
      return true;
    }

    if (isInitializing) {
      return false;
    }

    setInitializing(true);

    try {
      // Usar API route (server-side) para inicializar pastas
      // No servidor, env variables sao acessiveis em runtime
      const response = await fetch('/api/drive/init-folders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.folderIds) {
        setFolderIds(data.folderIds);
        setInitialized(true);
        return true;
      }

      throw new Error('Resposta inesperada da API');
    } catch (error) {
      // Fallback: tentar client-side
      try {
        const service = createDriveService(accessToken);
        const ids = await service.initializeFolderStructure();
        setFolderIds(ids);
        setInitialized(true);
        return true;
      } catch (fallbackError) {
        console.error('Erro ao inicializar Drive:', fallbackError);
        addToast('Erro ao conectar com Google Drive', 'error');
        setInitialized(false);
        return false;
      }
    }
  }, [accessToken, isInitialized, isInitializing, folderIds, setFolderIds, setInitializing, setInitialized, addToast]);

  /**
   * Obtem o ID da pasta de destino.
   */
  const getTargetFolderId = useCallback(async (
    service: ReturnType<typeof createDriveService>,
    ids: DriveFolderIds,
    targetFolder: DriveTargetFolder,
    options?: UseDriveUploadOptions
  ): Promise<string> => {
    const currentYear = options?.ano || new Date().getFullYear();
    const currentMonth = options?.mes || new Date().getMonth() + 1;

    switch (targetFolder) {
      case 'OCORRENCIAS':
        return getOcorrenciasFolderForYear(service, ids, currentYear);
      case 'MENSAGENS':
        return getMensagensFolderForMonth(service, ids, currentYear, currentMonth);
      case 'EXPORTS':
        return ids.EXPORTS;
      case 'COMUNICADOS':
        return ids.COMUNICADOS;
      case 'ATESTADOS':
        return ids.ATESTADOS;
      default:
        throw new Error(`Pasta desconhecida: ${targetFolder}`);
    }
  }, []);

  /**
   * Faz upload de um arquivo.
   */
  const upload = useCallback(async (
    file: File,
    targetFolder: DriveTargetFolder,
    options?: UseDriveUploadOptions
  ): Promise<DriveFile | null> => {
    // Verificar conexao
    if (!accessToken) {
      addToast('Faça login com Google para usar o Drive', 'warning');
      return null;
    }

    // Inicializar se necessario
    let ids = folderIds;
    if (!isInitialized || !ids) {
      const initialized = await initializeDrive();
      if (!initialized) return null;
      ids = useDriveStore.getState().folderIds;
      if (!ids) return null;
    }

    // Configurar estado
    setUploadState({
      isUploading: true,
      progress: 0,
      error: null,
      currentFile: file.name,
    });
    incrementPendingUploads();

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const service = createDriveService(accessToken);
      const folderId = await getTargetFolderId(service, ids, targetFolder, options);

      const result = await service.uploadFile({
        file,
        folderId,
        onProgress: (progress) => {
          setUploadState((prev) => ({ ...prev, progress }));
        },
      });

      if (result.success && result.file) {
        setUploadState({
          isUploading: false,
          progress: 100,
          error: null,
          currentFile: null,
        });
        return result.file;
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer upload';
      setUploadState({
        isUploading: false,
        progress: 0,
        error: errorMessage,
        currentFile: null,
      });
      addToast(errorMessage, 'error');
      return null;
    } finally {
      decrementPendingUploads();
      setAbortController(null);
    }
  }, [
    accessToken,
    folderIds,
    isInitialized,
    initializeDrive,
    getTargetFolderId,
    incrementPendingUploads,
    decrementPendingUploads,
    addToast,
  ]);

  /**
   * Faz upload de multiplos arquivos.
   */
  const uploadMultiple = useCallback(async (
    files: File[],
    targetFolder: DriveTargetFolder,
    options?: UseDriveUploadOptions
  ): Promise<DriveFile[]> => {
    const results: DriveFile[] = [];

    for (const file of files) {
      const result = await upload(file, targetFolder, options);
      if (result) {
        results.push(result);
      }
    }

    if (results.length === files.length) {
      addToast(`${results.length} arquivo(s) enviado(s) com sucesso`, 'success');
    } else if (results.length > 0) {
      addToast(`${results.length} de ${files.length} arquivo(s) enviado(s)`, 'warning');
    }

    return results;
  }, [upload, addToast]);

  /**
   * Cancela o upload em andamento.
   */
  const cancelUpload = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setUploadState({
        isUploading: false,
        progress: 0,
        error: 'Upload cancelado',
        currentFile: null,
      });
    }
  }, [abortController]);

  return {
    upload,
    uploadMultiple,
    uploadState,
    isConnected,
    initializeDrive,
    cancelUpload,
  };
}
