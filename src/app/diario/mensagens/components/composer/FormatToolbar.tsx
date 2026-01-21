/**
 * Barra de ferramentas de formatação WhatsApp.
 */

'use client';
import { IconButton, Tooltip, Divider, Box } from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  StrikethroughS,
  Code,
  DataObject,
  FormatListBulleted,
  FormatQuote,
  EmojiEmotions,
  AttachFile,
} from '@mui/icons-material';
import { FormatType } from '../../types';

interface FormatButton {
  format: FormatType;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

const FORMAT_BUTTONS: FormatButton[] = [
  { format: 'bold', icon: <FormatBold />, label: 'Negrito', shortcut: 'Ctrl+B' },
  { format: 'italic', icon: <FormatItalic />, label: 'Itálico', shortcut: 'Ctrl+I' },
  { format: 'strike', icon: <StrikethroughS />, label: 'Tachado' },
  { format: 'mono', icon: <Code />, label: 'Monoespaçado' },
  { format: 'code', icon: <DataObject />, label: 'Bloco de código' },
  { format: 'list', icon: <FormatListBulleted />, label: 'Lista' },
  { format: 'quote', icon: <FormatQuote />, label: 'Citação' },
];

interface FormatToolbarProps {
  onFormat: (format: FormatType) => void;
  onEmojiClick?: () => void;
  onAttachClick?: () => void;
  disabled?: boolean;
  showEmoji?: boolean;
  showAttach?: boolean;
  size?: 'small' | 'medium';
}

export function FormatToolbar({
  onFormat,
  onEmojiClick,
  onAttachClick,
  disabled = false,
  showEmoji = true,
  showAttach = true,
  size = 'small',
}: FormatToolbarProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        flexWrap: 'wrap',
        py: 0.5,
      }}
    >
      {FORMAT_BUTTONS.map((btn) => (
        <Tooltip
          key={btn.format}
          title={`${btn.label}${btn.shortcut ? ` (${btn.shortcut})` : ''}`}
        >
          <span>
            <IconButton
              size={size}
              onClick={() => onFormat(btn.format)}
              disabled={disabled}
              sx={{
                borderRadius: 1,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              {btn.icon}
            </IconButton>
          </span>
        </Tooltip>
      ))}

      {(showEmoji || showAttach) && (
        <>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          {showEmoji && onEmojiClick && (
            <Tooltip title="Inserir emoji">
              <span>
                <IconButton
                  size={size}
                  onClick={onEmojiClick}
                  disabled={disabled}
                  sx={{ borderRadius: 1 }}
                >
                  <EmojiEmotions />
                </IconButton>
              </span>
            </Tooltip>
          )}

          {showAttach && onAttachClick && (
            <Tooltip title="Anexar arquivo">
              <span>
                <IconButton
                  size={size}
                  onClick={onAttachClick}
                  disabled={disabled}
                  sx={{ borderRadius: 1 }}
                >
                  <AttachFile />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </>
      )}
    </Box>
  );
}
