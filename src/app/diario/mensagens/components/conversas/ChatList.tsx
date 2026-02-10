'use client';

import { useState, useMemo } from 'react';
import { Box, TextField, InputAdornment, Typography, CircularProgress, Chip } from '@mui/material';
import { Search } from '@mui/icons-material';
import { ChatConversation } from '../../types';
import { ChatListItem } from './ChatListItem';

type ChatFilter = 'todos' | 'nao_lidos' | 'grupos' | 'contatos';

const FILTER_OPTIONS: { value: ChatFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'nao_lidos', label: 'Nao lidos' },
  { value: 'grupos', label: 'Grupos' },
  { value: 'contatos', label: 'Contatos' },
];

interface ChatListProps {
  chats: ChatConversation[];
  selectedJid: string | null;
  loading: boolean;
  onSelect: (jid: string) => void;
}

export function ChatList({ chats, selectedJid, loading, onSelect }: ChatListProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ChatFilter>('todos');

  const filtered = useMemo(() => {
    let result = chats;

    // Filtro por categoria
    switch (filter) {
      case 'nao_lidos':
        result = result.filter((c) => c.unreadCount > 0);
        break;
      case 'grupos':
        result = result.filter((c) => c.isGroup);
        break;
      case 'contatos':
        result = result.filter((c) => !c.isGroup);
        break;
    }

    // Filtro por busca
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.remoteJid.includes(q) ||
          c.lastMessage?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [chats, search, filter]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Filter chips */}
      <Box
        sx={{
          display: 'flex',
          gap: 0.5,
          px: 1,
          pt: 0.75,
          pb: 0.5,
          overflowX: 'auto',
          '&::-webkit-scrollbar': { height: 0 },
        }}
      >
        {FILTER_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            size="small"
            onClick={() => setFilter(opt.value)}
            sx={{
              fontSize: '0.7rem',
              height: 24,
              flexShrink: 0,
              fontWeight: filter === opt.value ? 600 : 400,
              bgcolor:
                filter === opt.value
                  ? (theme) =>
                      theme.palette.mode === 'dark' ? '#005C4B' : '#D9FDD3'
                  : 'transparent',
              color:
                filter === opt.value
                  ? (theme) =>
                      theme.palette.mode === 'dark' ? '#E9EDEF' : '#111B21'
                  : (theme) =>
                      theme.palette.mode === 'dark' ? '#8696A0' : '#667781',
              border: '1px solid',
              borderColor:
                filter === opt.value
                  ? (theme) =>
                      theme.palette.mode === 'dark' ? '#005C4B' : '#D9FDD3'
                  : (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(134,150,160,0.3)'
                        : 'rgba(134,150,160,0.4)',
              '&:hover': {
                bgcolor:
                  filter === opt.value
                    ? (theme) =>
                        theme.palette.mode === 'dark' ? '#005C4B' : '#D9FDD3'
                    : (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.04)',
              },
              cursor: 'pointer',
            }}
          />
        ))}
      </Box>

      {/* Search */}
      <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar conversa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': { borderRadius: 2 },
          }}
        />
      </Box>

      {/* List */}
      <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {loading && chats.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Typography variant="body2">
              {search || filter !== 'todos'
                ? 'Nenhuma conversa encontrada'
                : 'Nenhuma conversa'}
            </Typography>
          </Box>
        ) : (
          filtered.map((chat) => (
            <ChatListItem
              key={chat.remoteJid}
              chat={chat}
              selected={chat.remoteJid === selectedJid}
              onClick={() => onSelect(chat.remoteJid)}
            />
          ))
        )}
      </Box>
    </Box>
  );
}
