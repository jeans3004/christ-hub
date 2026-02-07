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
        gap: 1,
        p: 1,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: (theme) =>
          theme.palette.mode === 'dark' ? '#1F2C33' : '#F0F2F5',
      }}
    >
      <TextField
        fullWidth
        size="small"
        multiline
        maxRows={4}
        placeholder="Digite uma mensagem..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || sending}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            bgcolor: 'background.paper',
          },
        }}
      />
      <IconButton
        color="primary"
        onClick={handleSend}
        disabled={!text.trim() || disabled || sending}
        sx={{
          bgcolor: '#25D366',
          color: '#fff',
          '&:hover': { bgcolor: '#1DA851' },
          '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
          alignSelf: 'flex-end',
        }}
      >
        <Send fontSize="small" />
      </IconButton>
    </Box>
  );
}
