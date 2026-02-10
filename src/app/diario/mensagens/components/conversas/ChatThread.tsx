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
import { ArrowBack, Person, InfoOutlined } from '@mui/icons-material';
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
  onToggleSidebar?: () => void;
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
  onToggleSidebar,
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
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? '#0B141A' : '#ECE5DD',
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
          gap: 1.5,
          px: 2,
          py: 1,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? '#202C33' : '#F0F2F5',
        }}
      >
        {showBackButton && (
          <IconButton size="small" onClick={onBack} sx={{ mr: -0.5 }}>
            <ArrowBack fontSize="small" />
          </IconButton>
        )}
        <Avatar
          src={chat.profilePicUrl || undefined}
          sx={{ width: 40, height: 40, bgcolor: '#DFE5E7', color: '#fff' }}
        >
          {chat.isGroup ? '👥' : <Person />}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            noWrap
            sx={{
              fontSize: '1rem',
              fontWeight: 500,
              color: (theme) =>
                theme.palette.mode === 'dark' ? '#E9EDEF' : '#111B21',
            }}
          >
            {displayName}
          </Typography>
        </Box>
        {onToggleSidebar && (
          <IconButton size="small" onClick={onToggleSidebar}>
            <InfoOutlined fontSize="small" />
          </IconButton>
        )}
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
          messages.map((msg, idx) => {
            const prev = idx > 0 ? messages[idx - 1] : null;
            const currentSender = msg.fromMe ? '__me__' : (msg.participant || msg.remoteJid);
            const prevSender = prev ? (prev.fromMe ? '__me__' : (prev.participant || prev.remoteJid)) : null;
            const showSenderName = chat.isGroup
              ? currentSender !== prevSender
              : !msg.fromMe && currentSender !== prevSender;
            return (
              <ChatBubble
                key={msg.id}
                message={msg}
                isGroup={chat.isGroup}
                showSenderName={showSenderName}
              />
            );
          })
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
