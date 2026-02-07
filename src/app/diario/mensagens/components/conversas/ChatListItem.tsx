'use client';

import { Box, Typography, Avatar, Badge } from '@mui/material';
import { ChatConversation } from '../../types';

const MEDIA_PREVIEW: Record<string, string> = {
  image: '📷 Imagem',
  video: '🎬 Video',
  audio: '🎵 Audio',
  document: '📄 Documento',
};

interface ChatListItemProps {
  chat: ChatConversation;
  selected: boolean;
  onClick: () => void;
}

export function ChatListItem({ chat, selected, onClick }: ChatListItemProps) {
  const displayName =
    chat.name || chat.remoteJid.split('@')[0].replace(/^55/, '');

  const lastMsgPreview = chat.lastMessage || '';

  const time = chat.lastMessageTimestamp
    ? formatTimestamp(chat.lastMessageTimestamp)
    : '';

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.5,
        cursor: 'pointer',
        bgcolor: selected
          ? (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(37,211,102,0.15)'
                : 'rgba(37,211,102,0.08)'
          : 'transparent',
        '&:hover': {
          bgcolor: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.05)'
              : 'rgba(0,0,0,0.04)',
        },
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Badge
        badgeContent={chat.unreadCount}
        color="success"
        invisible={!chat.unreadCount}
      >
        <Avatar
          src={chat.profilePicUrl || undefined}
          sx={{ width: 44, height: 44, bgcolor: '#25D366' }}
        >
          {chat.isGroup ? '👥' : displayName.charAt(0).toUpperCase()}
        </Avatar>
      </Badge>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Typography
            variant="subtitle2"
            noWrap
            fontWeight={chat.unreadCount ? 700 : 500}
            sx={{ flex: 1, mr: 1 }}
          >
            {displayName}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ flexShrink: 0, fontSize: '0.65rem' }}
          >
            {time}
          </Typography>
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          noWrap
          sx={{ fontSize: '0.8rem' }}
        >
          {lastMsgPreview || '\u00A0'}
        </Typography>
      </Box>
    </Box>
  );
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts * 1000);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Ontem';

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}
