'use client';

import { Box, Typography, Avatar, Badge } from '@mui/material';
import { Person } from '@mui/icons-material';
import { ChatConversation } from '../../types';

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
        py: 1,
        cursor: 'pointer',
        bgcolor: selected
          ? (theme) =>
              theme.palette.mode === 'dark' ? '#2A3942' : '#F0F2F5'
          : 'transparent',
        '&:hover': {
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? '#202C33' : '#F5F6F6',
        },
        borderBottom: '1px solid',
        borderColor: (theme) =>
          theme.palette.mode === 'dark'
            ? 'rgba(134,150,160,0.15)'
            : 'rgba(134,150,160,0.2)',
      }}
    >
      <Badge
        badgeContent={chat.unreadCount}
        color="success"
        invisible={!chat.unreadCount}
      >
        <Avatar
          src={chat.profilePicUrl || undefined}
          sx={{
            width: 49,
            height: 49,
            bgcolor: '#DFE5E7',
            color: '#fff',
          }}
        >
          {chat.isGroup ? '👥' : <Person sx={{ fontSize: 28 }} />}
        </Avatar>
      </Badge>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Typography
            noWrap
            sx={{
              flex: 1,
              mr: 1,
              fontSize: '1rem',
              fontWeight: chat.unreadCount ? 600 : 400,
              color: (theme) =>
                theme.palette.mode === 'dark' ? '#E9EDEF' : '#111B21',
            }}
          >
            {displayName}
          </Typography>
          <Typography
            noWrap
            sx={{
              flexShrink: 0,
              fontSize: '0.7rem',
              color: chat.unreadCount ? '#25D366' : '#667781',
            }}
          >
            {time}
          </Typography>
        </Box>
        <Typography
          noWrap
          sx={{
            fontSize: '0.85rem',
            color: (theme) =>
              theme.palette.mode === 'dark' ? '#8696A0' : '#667781',
            lineHeight: 1.4,
          }}
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
