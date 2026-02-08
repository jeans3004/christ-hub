'use client';

import { useState, useCallback, KeyboardEvent } from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import { Send } from '@mui/icons-material';

interface ChatInputProps {
  onSend: (text: string) => Promise<boolean>;
  disabled?: boolean;
  sending?: boolean;
}

export function ChatInput({ onSend, disabled, sending }: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || disabled || sending) return;

    const success = await onSend(trimmed);
    if (success) setText('');
  }, [text, onSend, disabled, sending]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1,
        px: 1.5,
        py: 0.75,
        bgcolor: (theme) =>
          theme.palette.mode === 'dark' ? '#202C33' : '#F0F2F5',
      }}
    >
      <TextField
        fullWidth
        size="small"
        multiline
        maxRows={4}
        placeholder="Digite uma mensagem"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || sending}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? '#2A3942' : '#FFFFFF',
            '& fieldset': { border: 'none' },
            fontSize: '0.9375rem',
          },
        }}
      />
      <IconButton
        onClick={handleSend}
        disabled={!text.trim() || disabled || sending}
        sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          bgcolor: '#00A884',
          color: '#fff',
          flexShrink: 0,
          '&:hover': { bgcolor: '#008f6f' },
          '&.Mui-disabled': {
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.08)',
            color: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(255,255,255,0.3)'
                : 'rgba(0,0,0,0.3)',
          },
        }}
      >
        <Send fontSize="small" />
      </IconButton>
    </Box>
  );
}
