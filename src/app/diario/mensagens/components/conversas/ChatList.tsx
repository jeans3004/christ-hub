'use client';

import { useState, useMemo } from 'react';
import { Box, TextField, InputAdornment, Typography, CircularProgress } from '@mui/material';
import { Search } from '@mui/icons-material';
import { ChatConversation } from '../../types';
import { ChatListItem } from './ChatListItem';

interface ChatListProps {
  chats: ChatConversation[];
  selectedJid: string | null;
  loading: boolean;
  onSelect: (jid: string) => void;
}

export function ChatList({ chats, selectedJid, loading, onSelect }: ChatListProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return chats;
    const q = search.toLowerCase();
    return chats.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.remoteJid.includes(q) ||
        c.lastMessage?.toLowerCase().includes(q)
    );
  }, [chats, search]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
              {search ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa'}
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
