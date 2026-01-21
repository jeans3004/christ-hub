/**
 * Componente para upload de mídia (imagem, documento, áudio, vídeo).
 */

'use client';
import { useCallback, useRef, useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Typography,
  Alert,
} from '@mui/material';
import {
  AttachFile,
  Image,
  InsertDriveFile,
  AudioFile,
  Videocam,
  LocationOn,
  Person,
} from '@mui/icons-material';
import { TipoMensagemMedia, MEDIA_SIZE_LIMITS, MEDIA_ACCEPT_TYPES } from '../../types';

interface MediaOption {
  type: TipoMensagemMedia;
  label: string;
  icon: React.ReactNode;
  accept?: string;
}

const MEDIA_OPTIONS: MediaOption[] = [
  { type: 'image', label: 'Imagem', icon: <Image />, accept: MEDIA_ACCEPT_TYPES.image },
  { type: 'document', label: 'Documento', icon: <InsertDriveFile />, accept: MEDIA_ACCEPT_TYPES.document },
  { type: 'audio', label: 'Áudio', icon: <AudioFile />, accept: MEDIA_ACCEPT_TYPES.audio },
  { type: 'video', label: 'Vídeo', icon: <Videocam />, accept: MEDIA_ACCEPT_TYPES.video },
  { type: 'location', label: 'Localização', icon: <LocationOn /> },
  { type: 'contact', label: 'Contato', icon: <Person /> },
];

interface MediaUploaderProps {
  onMediaSelect: (media: {
    type: TipoMensagemMedia;
    url?: string;
    base64?: string;
    filename?: string;
    mimetype?: string;
  }) => void;
  onLocationSelect?: () => void;
  onContactSelect?: () => void;
  disabled?: boolean;
  allowedTypes?: TipoMensagemMedia[];
  buttonVariant?: 'text' | 'outlined' | 'contained';
  buttonSize?: 'small' | 'medium' | 'large';
}

export function MediaUploader({
  onMediaSelect,
  onLocationSelect,
  onContactSelect,
  disabled = false,
  allowedTypes = ['image', 'document', 'audio', 'video', 'location', 'contact'],
  buttonVariant = 'outlined',
  buttonSize = 'medium',
}: MediaUploaderProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState<TipoMensagemMedia | null>(null);

  const filteredOptions = MEDIA_OPTIONS.filter((opt) => allowedTypes.includes(opt.type));

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setError(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOptionClick = (option: MediaOption) => {
    handleClose();

    if (option.type === 'location') {
      onLocationSelect?.();
      return;
    }

    if (option.type === 'contact') {
      onContactSelect?.();
      return;
    }

    // Para tipos com arquivo, abre o seletor
    setSelectedType(option.type);
    if (fileInputRef.current) {
      fileInputRef.current.accept = option.accept || '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !selectedType) return;

      // Validar tamanho
      const sizeLimit = MEDIA_SIZE_LIMITS[selectedType];
      if (sizeLimit && file.size > sizeLimit) {
        const limitMB = Math.round(sizeLimit / (1024 * 1024));
        setError(`Arquivo muito grande. Limite: ${limitMB}MB`);
        return;
      }

      setUploading(true);
      setError(null);

      try {
        // Converter para base64
        const base64 = await fileToBase64(file);

        onMediaSelect({
          type: selectedType,
          base64,
          filename: file.name,
          mimetype: file.type,
        });
      } catch (err) {
        console.error('Erro ao processar arquivo:', err);
        setError('Erro ao processar arquivo');
      } finally {
        setUploading(false);
        setSelectedType(null);
        // Limpa o input para permitir selecionar o mesmo arquivo novamente
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [selectedType, onMediaSelect]
  );

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        hidden
        onChange={handleFileChange}
      />

      <Button
        variant={buttonVariant}
        size={buttonSize}
        startIcon={<AttachFile />}
        onClick={handleClick}
        disabled={disabled || uploading}
      >
        Anexar
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        {filteredOptions.map((option) => (
          <MenuItem
            key={option.type}
            onClick={() => handleOptionClick(option)}
            disabled={disabled}
          >
            <ListItemIcon>{option.icon}</ListItemIcon>
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </Menu>

      {uploading && (
        <Box sx={{ mt: 1 }}>
          <LinearProgress />
          <Typography variant="caption" color="text.secondary">
            Processando arquivo...
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </Box>
  );
}

// Helper para converter arquivo para base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove o prefixo "data:mimetype;base64,"
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}
