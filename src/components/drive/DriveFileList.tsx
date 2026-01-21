/**
 * Lista de arquivos do Google Drive.
 * Exibe arquivos com opcoes de visualizar e deletar.
 */

'use client';

import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Tooltip,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  InsertDriveFile,
  Image,
  PictureAsPdf,
  Description,
  AudioFile,
  VideoFile,
  OpenInNew,
  Delete,
} from '@mui/icons-material';
import { OcorrenciaAnexo } from '@/types/drive';

interface DriveFileListProps {
  files: OcorrenciaAnexo[];
  onDelete?: (fileId: string) => void;
  loading?: boolean;
  readOnly?: boolean;
  compact?: boolean;
}

/**
 * Retorna o icone apropriado para o tipo de arquivo.
 */
function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return <Image color="primary" />;
  }
  if (mimeType === 'application/pdf') {
    return <PictureAsPdf color="error" />;
  }
  if (
    mimeType.includes('document') ||
    mimeType.includes('word') ||
    mimeType.includes('text')
  ) {
    return <Description color="info" />;
  }
  if (mimeType.startsWith('audio/')) {
    return <AudioFile color="secondary" />;
  }
  if (mimeType.startsWith('video/')) {
    return <VideoFile color="warning" />;
  }
  return <InsertDriveFile />;
}

/**
 * Formata o tamanho do arquivo.
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Formata a data de upload.
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function DriveFileList({
  files,
  onDelete,
  loading = false,
  readOnly = false,
  compact = false,
}: DriveFileListProps) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (files.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
        Nenhum arquivo anexado
      </Typography>
    );
  }

  if (compact) {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {files.map((file) => (
          <Chip
            key={file.id}
            icon={getFileIcon(file.mimeType)}
            label={file.fileName}
            size="small"
            component="a"
            href={file.webViewLink}
            target="_blank"
            rel="noopener noreferrer"
            clickable
            onDelete={!readOnly && onDelete ? () => onDelete(file.driveFileId) : undefined}
            sx={{ maxWidth: 200 }}
          />
        ))}
      </Box>
    );
  }

  return (
    <List dense disablePadding>
      {files.map((file) => (
        <ListItem
          key={file.id}
          sx={{
            bgcolor: 'action.hover',
            borderRadius: 1,
            mb: 0.5,
            '&:hover': {
              bgcolor: 'action.selected',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            {getFileIcon(file.mimeType)}
          </ListItemIcon>

          <ListItemText
            primary={
              <Typography
                variant="body2"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 200,
                }}
              >
                {file.fileName}
              </Typography>
            }
            secondary={
              <Typography variant="caption" color="text.secondary">
                {formatFileSize(file.size)} • {formatDate(new Date(file.uploadedAt))}
              </Typography>
            }
          />

          <ListItemSecondaryAction>
            <Tooltip title="Abrir no Drive">
              <IconButton
                edge="end"
                size="small"
                component="a"
                href={file.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <OpenInNew fontSize="small" />
              </IconButton>
            </Tooltip>

            {!readOnly && onDelete && (
              <Tooltip title="Remover">
                <IconButton
                  edge="end"
                  size="small"
                  color="error"
                  onClick={() => onDelete(file.driveFileId)}
                  sx={{ ml: 0.5 }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );
}
