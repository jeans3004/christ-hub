'use client';

import { Box, Typography } from '@mui/material';
import { ChatMessage } from '../../types';

const MEDIA_LABELS: Record<string, string> = {
  image: '📷 Imagem',
  video: '🎬 Video',
  audio: '🎵 Audio',
  document: '📄 Documento',
  sticker: '🏷️ Figurinha',
  contact: '👤 Contato',
  location: '📍 Localizacao',
};

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const { fromMe, text, mediaType, timestamp } = message;

  const time = timestamp
    ? new Date(timestamp * 1000).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const mediaLabel = mediaType ? MEDIA_LABELS[mediaType] || `[${mediaType}]` : null;
  const displayText = text || mediaLabel || '';

  if (!displayText) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: fromMe ? 'flex-end' : 'flex-start',
        mb: 0.5,
        px: 1,
      }}
    >
      <Box
        sx={{
          maxWidth: '75%',
          px: 1.5,
          py: 0.75,
          borderRadius: 2,
          borderTopLeftRadius: fromMe ? 8 : 0,
          borderTopRightRadius: fromMe ? 0 : 8,
          bgcolor: fromMe
            ? (theme) => (theme.palette.mode === 'dark' ? '#005C4B' : '#DCF8C6')
            : (theme) => (theme.palette.mode === 'dark' ? '#1F2C33' : '#FFFFFF'),
          boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
        }}
      >
        {mediaLabel && text && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mb: 0.25,
              fontStyle: 'italic',
              opacity: 0.7,
            }}
          >
            {mediaLabel}
          </Typography>
        )}
        <Typography
          variant="body2"
          sx={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: 1.4,
          }}
        >
          {mediaLabel && !text ? mediaLabel : text}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'right',
            mt: 0.25,
            opacity: 0.6,
            fontSize: '0.65rem',
            lineHeight: 1,
          }}
        >
          {time}
        </Typography>
      </Box>
    </Box>
  );
}
