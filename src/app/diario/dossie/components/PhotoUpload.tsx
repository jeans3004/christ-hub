/**
 * Componente de upload de foto do aluno.
 * Usa Google Drive (Shared Drive) para armazenamento.
 */

import { useRef, useState } from 'react';
import {
  Box,
  Avatar,
  IconButton,
  CircularProgress,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  CameraAlt,
  Delete,
  Person,
  Upload,
  CloudOff,
} from '@mui/icons-material';
import { useStudentPhoto } from '../hooks';

interface PhotoUploadProps {
  alunoId: string;
  alunoNome: string;
  fotoUrl?: string;
  canEdit: boolean;
  onPhotoChange: (newUrl: string | null) => void;
}

export function PhotoUpload({
  alunoId,
  alunoNome,
  fotoUrl,
  canEdit,
  onPhotoChange,
}: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { uploading, progress, uploadPhoto, deletePhoto, isDriveConnected } = useStudentPhoto();

  const getInitials = (nome: string) => {
    const parts = nome.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0]?.substring(0, 2).toUpperCase() || '';
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (!canEdit) return;
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleUploadClick = () => {
    handleMenuClose();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const newUrl = await uploadPhoto(alunoId, file);
    if (newUrl) {
      onPhotoChange(newUrl);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    handleMenuClose();
    if (!fotoUrl) return;

    const success = await deletePhoto(alunoId, fotoUrl);
    if (success) {
      onPhotoChange(null);
    }
  };

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      <Avatar
        src={fotoUrl}
        sx={{
          width: 120,
          height: 120,
          bgcolor: 'primary.light',
          fontSize: '2.5rem',
          cursor: canEdit ? 'pointer' : 'default',
        }}
        onClick={handleMenuOpen}
      >
        {uploading ? (
          <CircularProgress
            variant="determinate"
            value={progress}
            size={60}
            sx={{ color: 'white' }}
          />
        ) : !fotoUrl ? (
          alunoNome ? getInitials(alunoNome) : <Person sx={{ fontSize: 60 }} />
        ) : null}
      </Avatar>

      {canEdit && !uploading && (
        <Tooltip title={isDriveConnected ? 'Alterar foto' : 'Drive não conectado'}>
          <span style={{ position: 'absolute', bottom: 0, right: 0 }}>
            <IconButton
              size="small"
              sx={{
                bgcolor: isDriveConnected ? 'primary.main' : 'warning.main',
                color: 'white',
                '&:hover': {
                  bgcolor: isDriveConnected ? 'primary.dark' : 'warning.dark',
                },
              }}
              onClick={handleMenuOpen}
              disabled={!isDriveConnected}
            >
              {isDriveConnected ? <CameraAlt fontSize="small" /> : <CloudOff fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MenuItem onClick={handleUploadClick}>
          <ListItemIcon>
            <Upload fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {fotoUrl ? 'Alterar foto' : 'Carregar foto'}
          </ListItemText>
        </MenuItem>
        {fotoUrl && (
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <Delete fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText sx={{ color: 'error.main' }}>
              Remover foto
            </ListItemText>
          </MenuItem>
        )}
      </Menu>

      {uploading && (
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            bottom: -20,
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
          }}
        >
          {Math.round(progress)}%
        </Typography>
      )}
    </Box>
  );
}
