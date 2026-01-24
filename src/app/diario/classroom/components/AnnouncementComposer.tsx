/**
 * Compositor de anuncios do Google Classroom com formatacao.
 */

'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  IconButton,
  Tooltip,
  Divider,
  Paper,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
} from '@mui/material';
import {
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatStrikethrough as StrikeIcon,
  Code as CodeIcon,
  Link as LinkIcon,
  FormatListBulleted as ListIcon,
  Send as SendIcon,
  Preview as PreviewIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useDriveStore } from '@/store/driveStore';
import { useUIStore } from '@/store/uiStore';

interface AnnouncementComposerProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  courseName: string;
  onSuccess: () => void;
}

const CLASSROOM_API_BASE = 'https://classroom.googleapis.com/v1';

export function AnnouncementComposer({
  open,
  onClose,
  courseId,
  courseName,
  onSuccess,
}: AnnouncementComposerProps) {
  const { accessToken } = useDriveStore();
  const { addToast } = useUIStore();

  const [text, setText] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Aplica formatacao ao texto selecionado
  const applyFormat = useCallback(
    (format: 'bold' | 'italic' | 'underline' | 'strike' | 'code' | 'link' | 'list') => {
      const textarea = document.getElementById('announcement-text') as HTMLTextAreaElement;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = text.substring(start, end);

      let newText = '';
      let cursorOffset = 0;

      switch (format) {
        case 'bold':
          newText = `*${selectedText}*`;
          cursorOffset = 1;
          break;
        case 'italic':
          newText = `_${selectedText}_`;
          cursorOffset = 1;
          break;
        case 'underline':
          // Google Classroom nao suporta underline, usar negrito como fallback
          newText = `*${selectedText}*`;
          cursorOffset = 1;
          break;
        case 'strike':
          newText = `~${selectedText}~`;
          cursorOffset = 1;
          break;
        case 'code':
          newText = selectedText.includes('\n') ? `\`\`\`\n${selectedText}\n\`\`\`` : `\`${selectedText}\``;
          cursorOffset = selectedText.includes('\n') ? 4 : 1;
          break;
        case 'link':
          const url = prompt('Digite a URL:');
          if (url) {
            newText = `${selectedText} (${url})`;
          } else {
            return;
          }
          break;
        case 'list':
          const lines = selectedText.split('\n');
          newText = lines.map((line) => `• ${line}`).join('\n');
          cursorOffset = 0;
          break;
        default:
          return;
      }

      const beforeSelection = text.substring(0, start);
      const afterSelection = text.substring(end);
      setText(beforeSelection + newText + afterSelection);

      // Restaurar foco e posicao do cursor
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + newText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [text]
  );

  // Converte formatacao para preview visual
  const formatPreview = (content: string): string => {
    if (!content) return '';

    let formatted = content;

    // Negrito *texto*
    formatted = formatted.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');

    // Italico _texto_
    formatted = formatted.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Tachado ~texto~
    formatted = formatted.replace(/~([^~]+)~/g, '<s>$1</s>');

    // Codigo em bloco ```texto```
    formatted = formatted.replace(/```\n?([\s\S]*?)\n?```/g, '<pre style="background:#f5f5f5;padding:8px;border-radius:4px;overflow-x:auto;"><code>$1</code></pre>');

    // Codigo inline `texto`
    formatted = formatted.replace(/`([^`]+)`/g, '<code style="background:#f5f5f5;padding:2px 4px;border-radius:2px;">$1</code>');

    // Links (texto) (url)
    formatted = formatted.replace(/\(([^)]+)\)\s*\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // Quebras de linha
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
  };

  // Envia o anuncio
  const handleSend = async () => {
    if (!text.trim()) {
      addToast('Digite o conteudo do anuncio', 'warning');
      return;
    }

    if (!accessToken) {
      setError('Token de acesso nao disponivel. Faca login novamente.');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch(`${CLASSROOM_API_BASE}/courses/${courseId}/announcements`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          state: 'PUBLISHED',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Erro ${response.status}: ${response.statusText}`);
      }

      addToast('Anuncio publicado com sucesso!', 'success');
      setText('');
      setIsPreview(false);
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao publicar anuncio';
      setError(message);
      addToast(message, 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (isSending) return;
    setText('');
    setIsPreview(false);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Novo Anuncio</Typography>
          <Typography variant="body2" color="text.secondary">
            {courseName}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Barra de formatacao */}
        <Paper variant="outlined" sx={{ p: 1, mb: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          <Tooltip title="Negrito (*texto*)">
            <IconButton size="small" onClick={() => applyFormat('bold')}>
              <BoldIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Italico (_texto_)">
            <IconButton size="small" onClick={() => applyFormat('italic')}>
              <ItalicIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Tachado (~texto~)">
            <IconButton size="small" onClick={() => applyFormat('strike')}>
              <StrikeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title="Codigo (`texto`)">
            <IconButton size="small" onClick={() => applyFormat('code')}>
              <CodeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Link">
            <IconButton size="small" onClick={() => applyFormat('link')}>
              <LinkIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Lista">
            <IconButton size="small" onClick={() => applyFormat('list')}>
              <ListIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Box sx={{ flex: 1 }} />
          <ToggleButtonGroup
            size="small"
            value={isPreview ? 'preview' : 'edit'}
            exclusive
            onChange={(_, value) => value && setIsPreview(value === 'preview')}
          >
            <ToggleButton value="edit">
              <EditIcon fontSize="small" sx={{ mr: 0.5 }} />
              Editar
            </ToggleButton>
            <ToggleButton value="preview">
              <PreviewIcon fontSize="small" sx={{ mr: 0.5 }} />
              Preview
            </ToggleButton>
          </ToggleButtonGroup>
        </Paper>

        {/* Editor ou Preview */}
        {isPreview ? (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              minHeight: 200,
              bgcolor: 'background.default',
            }}
          >
            {text ? (
              <Box
                sx={{
                  '& strong': { fontWeight: 700 },
                  '& em': { fontStyle: 'italic' },
                  '& s': { textDecoration: 'line-through' },
                  '& a': { color: 'primary.main' },
                  '& pre': { my: 1 },
                  '& code': { fontFamily: 'monospace' },
                }}
                dangerouslySetInnerHTML={{ __html: formatPreview(text) }}
              />
            ) : (
              <Typography color="text.secondary" fontStyle="italic">
                Nenhum conteudo para visualizar
              </Typography>
            )}
          </Paper>
        ) : (
          <TextField
            id="announcement-text"
            multiline
            fullWidth
            rows={8}
            placeholder="Digite o anuncio aqui...&#10;&#10;Use formatacao:&#10;*negrito* _italico_ ~tachado~ `codigo`&#10;&#10;Para links: (texto) (url)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isSending}
            sx={{
              '& .MuiInputBase-input': {
                fontFamily: 'inherit',
              },
            }}
          />
        )}

        {/* Dicas de formatacao */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Dicas de formatacao: <code>*negrito*</code> <code>_italico_</code>{' '}
            <code>~tachado~</code> <code>`codigo`</code>
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isSending}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={isSending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          onClick={handleSend}
          disabled={isSending || !text.trim()}
        >
          {isSending ? 'Publicando...' : 'Publicar Anuncio'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
