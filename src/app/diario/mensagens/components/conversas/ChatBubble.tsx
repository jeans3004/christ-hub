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

// Paleta de cores para nomes de remetentes em grupos
const SENDER_COLORS = [
  '#E15D64', '#D4805A', '#D6993B', '#58A65C',
  '#45A5A0', '#5DADE2', '#6C83C4', '#B07CC6',
  '#CF6FA0', '#E67E73', '#68B984', '#7B98D1',
];

function getSenderColor(sender: string): string {
  let hash = 0;
  for (let i = 0; i < sender.length; i++) {
    hash = ((hash << 5) - hash + sender.charCodeAt(i)) | 0;
  }
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
}

interface ChatBubbleProps {
  message: ChatMessage;
  isGroup?: boolean;
  showSenderName?: boolean;
}

export function ChatBubble({ message, isGroup, showSenderName }: ChatBubbleProps) {
  const { fromMe, text, mediaType, timestamp, status, pushName, participant } = message;

  const time = timestamp
    ? new Date(timestamp * 1000).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const mediaLabel = mediaType ? MEDIA_LABELS[mediaType] || `[${mediaType}]` : null;
  const displayText = text || mediaLabel || '';

  if (!displayText) return null;

  // Determinar nome do remetente
  const senderName = pushName || (participant ? participant.split('@')[0] : '');
  const senderKey = participant || (fromMe ? '__me__' : message.remoteJid);
  const shouldShowName = showSenderName && !fromMe && senderName;

  // Checkmarks for sent messages
  const checkmark = fromMe
    ? status === 'READ' || status === 'PLAYED'
      ? ' ✓✓'
      : status === 'DELIVERY_ACK' || status === 'DELIVERED'
        ? ' ✓✓'
        : ' ✓'
    : '';

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: fromMe ? 'flex-end' : 'flex-start',
        mb: 0.25,
        px: 1.5,
        mt: shouldShowName ? 0.5 : 0,
      }}
    >
      <Box
        sx={{
          maxWidth: '65%',
          position: 'relative',
          px: 1.5,
          py: 0.5,
          pb: 0.75,
          borderRadius: '7.5px',
          borderTopLeftRadius: fromMe ? '7.5px' : 0,
          borderTopRightRadius: fromMe ? 0 : '7.5px',
          bgcolor: fromMe
            ? (theme) => (theme.palette.mode === 'dark' ? '#005C4B' : '#D9FDD3')
            : (theme) => (theme.palette.mode === 'dark' ? '#202C33' : '#FFFFFF'),
          boxShadow: '0 1px 0.5px rgba(11,20,26,0.13)',
          // Tail triangle
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            width: 0,
            height: 0,
            ...(fromMe
              ? {
                  right: -8,
                  borderLeft: '8px solid',
                  borderLeftColor: (theme: { palette: { mode: string } }) =>
                    theme.palette.mode === 'dark' ? '#005C4B' : '#D9FDD3',
                  borderBottom: '8px solid transparent',
                }
              : {
                  left: -8,
                  borderRight: '8px solid',
                  borderRightColor: (theme: { palette: { mode: string } }) =>
                    theme.palette.mode === 'dark' ? '#202C33' : '#FFFFFF',
                  borderBottom: '8px solid transparent',
                }),
          },
        }}
      >
        {/* Sender name header */}
        {shouldShowName && (
          <Typography
            component="span"
            sx={{
              display: 'block',
              fontWeight: 600,
              fontSize: '0.8125rem',
              lineHeight: 1.4,
              mb: 0.125,
              color: isGroup ? getSenderColor(senderKey) : 'primary.main',
              userSelect: 'none',
            }}
          >
            {senderName}
          </Typography>
        )}
        {mediaLabel && text && (
          <Typography
            component="span"
            sx={{
              display: 'block',
              mb: 0.25,
              fontStyle: 'italic',
              opacity: 0.7,
              fontSize: '0.8rem',
            }}
          >
            {mediaLabel}
          </Typography>
        )}
        <Typography
          component="span"
          sx={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: 1.35,
            fontSize: '0.875rem',
            color: (theme) =>
              theme.palette.mode === 'dark' ? '#E9EDEF' : '#111B21',
          }}
        >
          {mediaLabel && !text ? mediaLabel : text}
          {/* Inline timestamp + checkmarks */}
          <Typography
            component="span"
            sx={{
              float: 'right',
              ml: 1,
              mt: '3px',
              fontSize: '0.6875rem',
              lineHeight: 1,
              color: fromMe
                ? (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.6)'
                      : 'rgba(0,0,0,0.45)'
                : (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.5)'
                      : '#667781',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            {time}{checkmark}
          </Typography>
        </Typography>
      </Box>
    </Box>
  );
}
