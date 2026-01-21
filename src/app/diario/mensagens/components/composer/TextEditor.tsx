/**
 * Editor de texto com suporte a formatação WhatsApp.
 */

'use client';
import { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Box, TextField, Typography, TextFieldProps } from '@mui/material';
import { FormatType } from '../../types';
import { useFormatting } from '../../hooks';
import { FormatToolbar } from './FormatToolbar';

const MAX_MESSAGE_LENGTH = 4096;

export interface TextEditorRef {
  focus: () => void;
  insertText: (text: string) => void;
}

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  minRows?: number;
  maxRows?: number;
  showToolbar?: boolean;
  showCharCount?: boolean;
  onEmojiClick?: () => void;
  onAttachClick?: () => void;
  error?: boolean;
  helperText?: string;
}

export const TextEditor = forwardRef<TextEditorRef, TextEditorProps>(function TextEditor(
  {
    value,
    onChange,
    placeholder = 'Digite sua mensagem...',
    disabled = false,
    maxLength = MAX_MESSAGE_LENGTH,
    minRows = 4,
    maxRows = 12,
    showToolbar = true,
    showCharCount = true,
    onEmojiClick,
    onAttachClick,
    error,
    helperText,
  },
  ref
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { applyFormat, insertAtCursor } = useFormatting();

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
    insertText: (text: string) => {
      const result = insertAtCursor(text, textareaRef as React.RefObject<HTMLTextAreaElement>);
      if (result) {
        onChange(result.newText);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(result.newCursorPos, result.newCursorPos);
            textareaRef.current.focus();
          }
        }, 0);
      }
    },
  }));

  const handleFormat = useCallback(
    (format: FormatType) => {
      const result = applyFormat(format, textareaRef as React.RefObject<HTMLTextAreaElement>);
      if (result) {
        onChange(result.newText);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(result.newCursorPos, result.newCursorPos);
            textareaRef.current.focus();
          }
        }, 0);
      }
    },
    [applyFormat, onChange]
  );

  // Atalhos de teclado
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            handleFormat('bold');
            break;
          case 'i':
            e.preventDefault();
            handleFormat('italic');
            break;
        }
      }
    },
    [handleFormat]
  );

  const charCount = value.length;
  const isOverLimit = charCount > maxLength;

  return (
    <Box sx={{ width: '100%' }}>
      {showToolbar && (
        <FormatToolbar
          onFormat={handleFormat}
          onEmojiClick={onEmojiClick}
          onAttachClick={onAttachClick}
          disabled={disabled}
          showEmoji={!!onEmojiClick}
          showAttach={!!onAttachClick}
        />
      )}

      <TextField
        inputRef={textareaRef}
        multiline
        minRows={minRows}
        maxRows={maxRows}
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        error={error || isOverLimit}
        helperText={helperText}
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: 'background.paper',
            fontFamily: 'inherit',
          },
        }}
      />

      {showCharCount && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            mt: 0.5,
          }}
        >
          <Typography
            variant="caption"
            color={isOverLimit ? 'error' : 'text.secondary'}
          >
            {charCount.toLocaleString()} / {maxLength.toLocaleString()}
          </Typography>
        </Box>
      )}
    </Box>
  );
});
