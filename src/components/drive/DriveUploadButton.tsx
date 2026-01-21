/**
 * Botao para upload de arquivos no Google Drive.
 * Exibe progresso e trata erros automaticamente.
 */

'use client';

import { useRef, useState } from 'react';
import {
  Button,
  IconButton,
  CircularProgress,
  LinearProgress,
  Box,
  Typography,
  Tooltip,
} from '@mui/material';
import { CloudUpload, AttachFile, Close } from '@mui/icons-material';
import { useDriveUpload, DriveTargetFolder } from '@/hooks/useDriveUpload';
import { useDriveStore } from '@/store/driveStore';
import { DriveFile, DRIVE_SIZE_LIMITS } from '@/types/drive';

interface DriveUploadButtonProps {
  targetFolder: DriveTargetFolder;
  onUploadComplete?: (file: DriveFile) => void;
  onUploadError?: (error: string) => void;
  allowedTypes?: string[];
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
  label?: string;
  iconOnly?: boolean;
  // Para pastas com subpastas
  ano?: number;
  mes?: number;
}

const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export function DriveUploadButton({
  targetFolder,
  onUploadComplete,
  onUploadError,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  maxSize = DRIVE_SIZE_LIMITS.DEFAULT,
  multiple = false,
  disabled = false,
  variant = 'outlined',
  size = 'medium',
  label = 'Anexar arquivo',
  iconOnly = false,
  ano,
  mes,
}: DriveUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const { upload, uploadMultiple, uploadState, isConnected, initializeDrive } = useDriveUpload();
  const { accessToken } = useDriveStore();

  const handleClick = async () => {
    setLocalError(null);

    // Verificar se tem token
    if (!accessToken) {
      setLocalError('Faça login com Google para usar o Drive');
      onUploadError?.('Faça login com Google para usar o Drive');
      return;
    }

    // Inicializar Drive se necessario
    if (!isConnected) {
      const initialized = await initializeDrive();
      if (!initialized) {
        setLocalError('Não foi possível conectar ao Drive');
        onUploadError?.('Não foi possível conectar ao Drive');
        return;
      }
    }

    // Abrir seletor de arquivo
    inputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validar arquivos
    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      // Verificar tipo
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        setLocalError(`Tipo de arquivo não permitido: ${file.name}`);
        onUploadError?.(`Tipo de arquivo não permitido: ${file.name}`);
        continue;
      }

      // Verificar tamanho
      if (file.size > maxSize) {
        const maxMB = Math.round(maxSize / (1024 * 1024));
        setLocalError(`Arquivo muito grande: ${file.name} (máx ${maxMB}MB)`);
        onUploadError?.(`Arquivo muito grande: ${file.name} (máx ${maxMB}MB)`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      // Limpar input
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    // Fazer upload
    const options = { ano, mes };

    if (multiple && validFiles.length > 1) {
      const results = await uploadMultiple(validFiles, targetFolder, options);
      results.forEach((file) => onUploadComplete?.(file));
    } else {
      const result = await upload(validFiles[0], targetFolder, options);
      if (result) {
        onUploadComplete?.(result);
      }
    }

    // Limpar input
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleCancel = () => {
    // Implementar cancelamento se necessario
    setLocalError(null);
  };

  const isUploading = uploadState.isUploading;
  const error = localError || uploadState.error;

  // Gerar accept string para o input
  const acceptTypes = allowedTypes.length > 0 ? allowedTypes.join(',') : undefined;

  if (iconOnly) {
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
        <input
          ref={inputRef}
          type="file"
          hidden
          accept={acceptTypes}
          multiple={multiple}
          onChange={handleFileChange}
        />
        <Tooltip title={error || label}>
          <span>
            <IconButton
              onClick={handleClick}
              disabled={disabled || isUploading}
              color={error ? 'error' : 'default'}
              size={size}
            >
              {isUploading ? (
                <CircularProgress size={24} />
              ) : (
                <AttachFile />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={acceptTypes}
        multiple={multiple}
        onChange={handleFileChange}
      />

      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={disabled || isUploading}
        startIcon={isUploading ? <CircularProgress size={20} /> : <CloudUpload />}
        color={error ? 'error' : 'primary'}
      >
        {isUploading ? 'Enviando...' : label}
      </Button>

      {isUploading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ flex: 1 }}>
            <LinearProgress
              variant="determinate"
              value={uploadState.progress}
              sx={{ height: 6, borderRadius: 1 }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {uploadState.progress}%
          </Typography>
          <IconButton size="small" onClick={handleCancel}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
      )}

      {uploadState.currentFile && (
        <Typography variant="caption" color="text.secondary">
          {uploadState.currentFile}
        </Typography>
      )}

      {error && !isUploading && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}
    </Box>
  );
}
