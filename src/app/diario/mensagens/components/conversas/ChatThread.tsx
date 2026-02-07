'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Avatar,
  Alert,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { ChatMessage, ChatConversation } from '../../types';
import { ChatBubble } from './ChatBubble';
import { ChatInput } from './ChatInput';

interface ChatThreadProps {
  chat: ChatConversation | null;
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  sendError?: string | null;
  onSend: (text: string) => Promise<boolean>;
  onBack: () => void;
  onClearSendError?: () => void;
  showBackButton?: boolean;
}

export function ChatThread({
  chat,
  messages,
  loading,
  sending,
  sendError,
  onSend,
  onBack,
  onClearSendError,
  showBackButton,
}: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const checkAtBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    isAtBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  }, []);

  // Auto-scroll only when at bottom
  useEffect(() => {
    if (isAtBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Scroll to bottom on first load
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat?.remoteJid]);

  if (!chat) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'text.secondary',
        }}
      >
        <Typography variant="body2">
          Selecione uma conversa para visualizar
        </Typography>
      </Box>
    );
  }

  const displayName =
    chat.name ||
    chat.remoteJid.split('@')[0].replace(/^55/, '');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? '#1F2C33' : '#F0F2F5',
        }}
      >
        {showBackButton && (
          <IconButton size="small" onClick={onBack}>
            <ArrowBack fontSize="small" />
          </IconButton>
        )}
        <Avatar
          src={chat.profilePicUrl || undefined}
          sx={{ width: 36, height: 36, bgcolor: '#25D366' }}
        >
          {displayName.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap fontWeight={600}>
            {displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {chat.remoteJid.split('@')[0]}
          </Typography>
        </Box>
      </Box>

      {/* Messages */}
      <Box
        ref={scrollRef}
        onScroll={checkAtBottom}
        sx={{
          flex: 1,
          overflowY: 'auto',
          py: 1,
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? '#0B141A' : '#ECE5DD',
          minHeight: 0,
        }}
      >
        {loading && messages.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Typography variant="body2">Nenhuma mensagem encontrada</Typography>
          </Box>
        ) : (
          messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)
        )}
      </Box>

      {/* Send Error */}
      {sendError && (
        <Alert severity="error" onClose={onClearSendError} sx={{ mx: 1, mt: 0.5 }}>
          {sendError}
        </Alert>
      )}

      {/* Input */}
      <ChatInput onSend={onSend} disabled={!chat} sending={sending} />
    </Box>
  );
}
