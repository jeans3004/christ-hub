'use client';

/**
 * Compositor de mensagem com formatação, preview e templates.
 * Mantém compatibilidade com a interface existente.
 */

import { useState, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Divider,
  Collapse,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Send,
  Preview as PreviewIcon,
  Description,
  ContentCopy,
} from '@mui/icons-material';
import { TemplateMensagem } from '@/types';
import { useFormatting } from '../hooks';
import { FormatType, TipoMensagemMedia, MediaData, generateMediaId } from '../types';
import {
  FormatToolbar,
  TextEditor,
  TextEditorRef,
  MessagePreview,
  EmojiPicker,
  MediaUploader,
  MediaPreview,
} from './composer';

interface MensagemComposerProps {
  value: string;
  onChange: (value: string) => void;
  templates?: TemplateMensagem[];
  onApplyTemplate?: (template: TemplateMensagem, variables?: Record<string, string>) => void;
  onSend?: () => void;
  sending?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  // Media props (single - retrocompatibilidade)
  media?: MediaData;
  onMediaChange?: (media: MediaData | undefined) => void;
  // Media props (multiple)
  medias?: MediaData[];
  onMediasChange?: (medias: MediaData[]) => void;
  allowMedia?: boolean;
  allowMultipleMedia?: boolean;
  maxMediaCount?: number;
}

const MAX_MESSAGE_LENGTH = 4096;

export function MensagemComposer({
  value,
  onChange,
  templates = [],
  onApplyTemplate,
  onSend,
  sending = false,
  disabled = false,
  placeholder = 'Digite sua mensagem...',
  maxLength = MAX_MESSAGE_LENGTH,
  media,
  onMediaChange,
  medias = [],
  onMediasChange,
  allowMedia = true,
  allowMultipleMedia = true,
  maxMediaCount = 10,
}: MensagemComposerProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [templateAnchor, setTemplateAnchor] = useState<null | HTMLElement>(null);
  const textEditorRef = useRef<TextEditorRef>(null);

  const charCount = value.length;
  const isOverLimit = charCount > maxLength;

  // Usar medias se disponível, senão usar media (retrocompatibilidade)
  const currentMedias = onMediasChange ? medias : (media ? [media] : []);
  const hasMedia = currentMedias.length > 0;
  const canAddMore = allowMultipleMedia ? currentMedias.length < maxMediaCount : currentMedias.length === 0;

  // Handler para selecionar mídia
  const handleMediaSelect = useCallback(
    (mediaData: {
      type: TipoMensagemMedia;
      url?: string;
      base64?: string;
      filename?: string;
      mimetype?: string;
    }) => {
      const newMedia: MediaData = {
        id: generateMediaId(),
        type: mediaData.type,
        base64: mediaData.base64,
        url: mediaData.url,
        filename: mediaData.filename,
        mimetype: mediaData.mimetype,
      };

      if (onMediasChange) {
        // Modo múltiplas mídias
        onMediasChange([...medias, newMedia]);
      } else if (onMediaChange) {
        // Modo mídia única (retrocompatibilidade)
        onMediaChange(newMedia);
      }
    },
    [onMediaChange, onMediasChange, medias]
  );

  // Handler para remover mídia
  const handleMediaRemove = useCallback((mediaId?: string) => {
    if (onMediasChange && mediaId) {
      // Modo múltiplas mídias - remover por ID
      onMediasChange(medias.filter(m => m.id !== mediaId));
    } else if (onMediaChange) {
      // Modo mídia única
      onMediaChange(undefined);
    }
  }, [onMediaChange, onMediasChange, medias]);

  // Handler para selecionar emoji
  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      textEditorRef.current?.insertText(emoji);
    },
    []
  );

  // Abrir menu de templates
  const handleTemplateClick = (event: React.MouseEvent<HTMLElement>) => {
    setTemplateAnchor(event.currentTarget);
  };

  const handleTemplateClose = () => {
    setTemplateAnchor(null);
  };

  const handleSelectTemplate = (template: TemplateMensagem) => {
    onApplyTemplate?.(template);
    handleTemplateClose();
  };

  // Copiar mensagem
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  return (
    <Box>
      {/* Header com título e ações */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Mensagem
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {templates.length > 0 && (
            <Tooltip title="Usar template">
              <span>
                <IconButton size="small" onClick={handleTemplateClick} disabled={disabled}>
                  <Description fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
          <EmojiPicker
            onSelect={handleEmojiSelect}
            disabled={disabled || sending}
            buttonSize="small"
          />
          <Tooltip title={showPreview ? 'Editar' : 'Preview'}>
            <span>
              <IconButton
                size="small"
                onClick={() => setShowPreview(!showPreview)}
                disabled={!value}
                color={showPreview ? 'primary' : 'default'}
              >
                <PreviewIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Copiar">
            <span>
              <IconButton size="small" onClick={handleCopy} disabled={!value}>
                <ContentCopy fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Media Preview (se houver mídia anexada) */}
      {hasMedia && currentMedias.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {currentMedias.length === 1 ? (
            // Mídia única - preview grande
            <MediaPreview
              type={currentMedias[0].type}
              url={currentMedias[0].base64 ? `data:${currentMedias[0].mimetype};base64,${currentMedias[0].base64}` : currentMedias[0].url}
              filename={currentMedias[0].filename}
              onRemove={() => handleMediaRemove(currentMedias[0].id)}
              showRemove={!disabled && !sending}
            />
          ) : (
            // Múltiplas mídias - preview compacto
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {currentMedias.map((m) => (
                <MediaPreview
                  key={m.id}
                  type={m.type}
                  url={m.base64 ? `data:${m.mimetype};base64,${m.base64}` : m.url}
                  filename={m.filename}
                  onRemove={() => handleMediaRemove(m.id)}
                  showRemove={!disabled && !sending}
                  compact
                />
              ))}
            </Box>
          )}
          {currentMedias.length > 1 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {currentMedias.length} anexos selecionados
            </Typography>
          )}
        </Box>
      )}

      {/* Preview ou Editor */}
      {showPreview ? (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            minHeight: 150,
            maxHeight: 300,
            overflow: 'auto',
            bgcolor: '#dcf8c6',
            borderRadius: 2,
          }}
        >
          <MessagePreview
            text={value}
            showCopyButton={false}
            variant="card"
          />
        </Paper>
      ) : (
        <TextEditor
          ref={textEditorRef}
          value={value}
          onChange={onChange}
          placeholder={hasMedia ? 'Legenda (opcional)...' : placeholder}
          disabled={disabled || sending}
          maxLength={maxLength}
          showToolbar={true}
          showCharCount={false}
          minRows={hasMedia ? 3 : 6}
        />
      )}

      {/* Contador e ações */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Botão de anexar mídia */}
          {allowMedia && (onMediaChange || onMediasChange) && canAddMore && (
            <MediaUploader
              onMediaSelect={handleMediaSelect}
              disabled={disabled || sending}
              allowedTypes={['image', 'document', 'audio', 'video']}
              buttonVariant="text"
              buttonSize="small"
            />
          )}
          <Typography
            variant="caption"
            color={isOverLimit ? 'error' : 'text.secondary'}
          >
            {charCount.toLocaleString()} / {maxLength.toLocaleString()} caracteres
            {hasMedia && allowMultipleMedia && ` | ${currentMedias.length}/${maxMediaCount} anexos`}
          </Typography>
        </Box>

        {onSend && (
          <Tooltip title={hasMedia ? 'Enviar mídia' : 'Enviar mensagem'}>
            <span>
              <IconButton
                color="primary"
                onClick={onSend}
                disabled={disabled || sending || (!value.trim() && !hasMedia) || isOverLimit}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '&:disabled': { bgcolor: 'action.disabledBackground' },
                }}
              >
                <Send />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>

      {/* Menu de templates */}
      <Menu
        anchorEl={templateAnchor}
        open={Boolean(templateAnchor)}
        onClose={handleTemplateClose}
        PaperProps={{ sx: { maxHeight: 300, width: 280 } }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 1 }}>
          Selecione um template
        </Typography>
        <Divider />
        {templates.length === 0 ? (
          <MenuItem disabled>
            <ListItemText primary="Nenhum template disponível" />
          </MenuItem>
        ) : (
          templates.map((template) => (
            <MenuItem key={template.id} onClick={() => handleSelectTemplate(template)}>
              <ListItemIcon>
                <Description fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={template.nome}
                secondary={
                  <Box component="span" sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                    <Chip label={template.categoria} size="small" variant="outlined" />
                    {template.variaveis.length > 0 && (
                      <Chip
                        label={`${template.variaveis.length} var`}
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    )}
                  </Box>
                }
              />
            </MenuItem>
          ))
        )}
      </Menu>
    </Box>
  );
}
