'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Divider,
} from '@mui/material';
import { Close, Person } from '@mui/icons-material';
import { ChatConversation } from '../../types';

const AVAILABLE_TAGS = [
  { label: 'Pai', color: '#3b82f6' },
  { label: 'Mae', color: '#ec4899' },
  { label: 'Aluno', color: '#10b981' },
  { label: 'Professor', color: '#8b5cf6' },
  { label: 'VIP', color: '#f59e0b' },
  { label: 'Pendente', color: '#ef4444' },
];

const STATUS_OPTIONS = [
  { value: 'aberto', label: 'Aberto' },
  { value: 'em_atendimento', label: 'Em atendimento' },
  { value: 'resolvido', label: 'Resolvido' },
  { value: 'arquivado', label: 'Arquivado' },
];

function getStorageKey(prefix: string, jid: string) {
  return `${prefix}:${jid}`;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}

interface ChatSidebarProps {
  chat: ChatConversation;
  onClose: () => void;
}

export function ChatSidebar({ chat, onClose }: ChatSidebarProps) {
  const jid = chat.remoteJid;

  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState('aberto');
  const [notes, setNotes] = useState('');

  // Carregar dados do localStorage quando muda o chat
  useEffect(() => {
    setTags(loadFromStorage(getStorageKey('chat-tags', jid), []));
    setStatus(loadFromStorage(getStorageKey('chat-status', jid), 'aberto'));
    setNotes(loadFromStorage(getStorageKey('chat-notes', jid), ''));
  }, [jid]);

  const toggleTag = useCallback((tag: string) => {
    setTags((prev) => {
      const next = prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag];
      saveToStorage(getStorageKey('chat-tags', jid), next);
      return next;
    });
  }, [jid]);

  const handleStatusChange = useCallback((value: string) => {
    setStatus(value);
    saveToStorage(getStorageKey('chat-status', jid), value);
  }, [jid]);

  const handleNotesChange = useCallback((value: string) => {
    setNotes(value);
    saveToStorage(getStorageKey('chat-notes', jid), value);
  }, [jid]);

  const displayName = chat.name || chat.remoteJid.split('@')[0].replace(/^55/, '');
  const phoneNumber = chat.remoteJid.split('@')[0];

  return (
    <Box
      sx={{
        width: 280,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: 1,
        borderColor: 'divider',
        bgcolor: (theme) =>
          theme.palette.mode === 'dark' ? '#111B21' : '#FFFFFF',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? '#202C33' : '#F0F2F5',
        }}
      >
        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
          Info do contato
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <Close fontSize="small" />
        </IconButton>
      </Box>

      {/* Scrollable content */}
      <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {/* Avatar + Info */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2.5, px: 2 }}>
          <Avatar
            src={chat.profilePicUrl || undefined}
            sx={{ width: 72, height: 72, mb: 1.5, bgcolor: '#DFE5E7', color: '#fff' }}
          >
            {chat.isGroup ? '👥' : <Person sx={{ fontSize: 36 }} />}
          </Avatar>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '1rem',
              textAlign: 'center',
              color: (theme) =>
                theme.palette.mode === 'dark' ? '#E9EDEF' : '#111B21',
            }}
          >
            {displayName}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.8rem',
              color: (theme) =>
                theme.palette.mode === 'dark' ? '#8696A0' : '#667781',
              mt: 0.25,
            }}
          >
            {phoneNumber}
          </Typography>
        </Box>

        <Divider />

        {/* Tags */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: (theme) =>
                theme.palette.mode === 'dark' ? '#8696A0' : '#667781',
              mb: 1,
              letterSpacing: '0.5px',
            }}
          >
            Tags
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {AVAILABLE_TAGS.map((t) => {
              const active = tags.includes(t.label);
              return (
                <Chip
                  key={t.label}
                  label={t.label}
                  size="small"
                  onClick={() => toggleTag(t.label)}
                  sx={{
                    fontSize: '0.7rem',
                    height: 26,
                    fontWeight: active ? 600 : 400,
                    bgcolor: active ? t.color : 'transparent',
                    color: active
                      ? '#fff'
                      : (theme) =>
                          theme.palette.mode === 'dark' ? '#8696A0' : '#667781',
                    border: '1px solid',
                    borderColor: active
                      ? t.color
                      : (theme) =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(134,150,160,0.3)'
                            : 'rgba(134,150,160,0.4)',
                    '&:hover': {
                      bgcolor: active
                        ? t.color
                        : (theme) =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.06)'
                              : 'rgba(0,0,0,0.04)',
                    },
                    cursor: 'pointer',
                  }}
                />
              );
            })}
          </Box>
        </Box>

        <Divider />

        {/* Status */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: (theme) =>
                theme.palette.mode === 'dark' ? '#8696A0' : '#667781',
              mb: 1,
              letterSpacing: '0.5px',
            }}
          >
            Status
          </Typography>
          <Select
            fullWidth
            size="small"
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            sx={{
              fontSize: '0.8rem',
              '& .MuiSelect-select': { py: 0.75 },
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.8rem' }}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </Box>

        <Divider />

        {/* Notas */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: (theme) =>
                theme.palette.mode === 'dark' ? '#8696A0' : '#667781',
              mb: 1,
              letterSpacing: '0.5px',
            }}
          >
            Notas
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            maxRows={8}
            size="small"
            placeholder="Adicionar notas sobre este contato..."
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': { fontSize: '0.8rem' },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
