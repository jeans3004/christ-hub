/**
 * Preview de mídia anexada com opção de remoção.
 */

'use client';
import { Box, Paper, Typography, IconButton, Tooltip, Chip } from '@mui/material';
import {
  Close,
  Image as ImageIcon,
  InsertDriveFile,
  AudioFile,
  Videocam,
  LocationOn,
  Person,
} from '@mui/icons-material';
import { TipoMensagemMedia } from '../../types';

interface MediaPreviewProps {
  type: TipoMensagemMedia;
  url?: string;
  filename?: string;
  locationName?: string;
  locationAddress?: string;
  contactName?: string;
  contactPhone?: string;
  onRemove?: () => void;
  showRemove?: boolean;
  compact?: boolean;
}

const TYPE_LABELS: Record<TipoMensagemMedia, string> = {
  text: 'Texto',
  image: 'Imagem',
  document: 'Documento',
  audio: 'Áudio',
  video: 'Vídeo',
  location: 'Localização',
  contact: 'Contato',
  sticker: 'Figurinha',
};

const TYPE_COLORS: Record<TipoMensagemMedia, string> = {
  text: 'default',
  image: 'success',
  document: 'warning',
  audio: 'info',
  video: 'secondary',
  location: 'error',
  contact: 'primary',
  sticker: 'default',
};

export function MediaPreview({
  type,
  url,
  filename,
  locationName,
  locationAddress,
  contactName,
  contactPhone,
  onRemove,
  showRemove = true,
  compact = false,
}: MediaPreviewProps) {
  const renderIcon = () => {
    const iconProps = { sx: { fontSize: compact ? 24 : 40, color: 'grey.500' } };

    switch (type) {
      case 'image':
        return <ImageIcon {...iconProps} />;
      case 'document':
        return <InsertDriveFile {...iconProps} />;
      case 'audio':
        return <AudioFile {...iconProps} />;
      case 'video':
        return <Videocam {...iconProps} />;
      case 'location':
        return <LocationOn {...iconProps} sx={{ ...iconProps.sx, color: 'error.main' }} />;
      case 'contact':
        return <Person {...iconProps} sx={{ ...iconProps.sx, color: 'primary.main' }} />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    // Imagem com preview
    if (type === 'image' && url) {
      return (
        <Box sx={{ position: 'relative' }}>
          <img
            src={url.startsWith('data:') ? url : url}
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: compact ? 80 : 150,
              borderRadius: 8,
              objectFit: 'cover',
            }}
          />
        </Box>
      );
    }

    // Localização
    if (type === 'location') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {renderIcon()}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={500} noWrap>
              {locationName || 'Localização'}
            </Typography>
            {locationAddress && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {locationAddress}
              </Typography>
            )}
          </Box>
        </Box>
      );
    }

    // Contato
    if (type === 'contact') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {renderIcon()}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={500} noWrap>
              {contactName || 'Contato'}
            </Typography>
            {contactPhone && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {contactPhone}
              </Typography>
            )}
          </Box>
        </Box>
      );
    }

    // Outros tipos (documento, áudio, vídeo)
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {renderIcon()}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={500} noWrap>
            {filename || `Arquivo ${type}`}
          </Typography>
          <Chip
            label={TYPE_LABELS[type]}
            size="small"
            color={TYPE_COLORS[type] as 'default' | 'success' | 'warning' | 'info' | 'secondary' | 'error' | 'primary'}
            variant="outlined"
            sx={{ mt: 0.5 }}
          />
        </Box>
      </Box>
    );
  };

  if (compact) {
    return (
      <Chip
        icon={renderIcon() as React.ReactElement}
        label={filename || locationName || contactName || TYPE_LABELS[type]}
        onDelete={showRemove && onRemove ? onRemove : undefined}
        variant="outlined"
        color={TYPE_COLORS[type] as 'default' | 'success' | 'warning' | 'info' | 'secondary' | 'error' | 'primary'}
        sx={{ maxWidth: 200 }}
      />
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        position: 'relative',
        borderRadius: 2,
        bgcolor: 'grey.50',
      }}
    >
      {renderContent()}

      {showRemove && onRemove && (
        <Tooltip title="Remover anexo">
          <IconButton
            size="small"
            onClick={onRemove}
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'grey.200' },
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Paper>
  );
}
