'use client';

/**
 * Compositor de mensagem com preview e contador.
 */

import { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import {
  Send,
  EmojiEmotions,
  Description,
  Preview,
  ContentCopy,
} from '@mui/icons-material';
import { TemplateMensagem } from '@/types';

interface MensagemComposerProps {
  value: string;
  onChange: (value: string) => void;
  templates?: TemplateMensagem[];
  onApplyTemplate?: (template: TemplateMensagem) => void;
  onSend?: () => void;
  sending?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

// Limite do WhatsApp
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
}: MensagemComposerProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [templateAnchor, setTemplateAnchor] = useState<null | HTMLElement>(null);

  const charCount = value.length;
  const isOverLimit = charCount > maxLength;

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Mensagem
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {templates.length > 0 && (
            <Tooltip title="Usar template">
              <IconButton size="small" onClick={handleTemplateClick} disabled={disabled}>
                <Description fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={showPreview ? 'Editar' : 'Preview'}>
            <IconButton size="small" onClick={() => setShowPreview(!showPreview)} disabled={!value}>
              <Preview fontSize="small" color={showPreview ? 'primary' : 'inherit'} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Copiar">
            <IconButton size="small" onClick={handleCopy} disabled={!value}>
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {showPreview ? (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            minHeight: 150,
            maxHeight: 300,
            overflow: 'auto',
            bgcolor: '#dcf8c6', // WhatsApp green
            borderRadius: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            {value || 'Nenhuma mensagem para visualizar'}
          </Typography>
        </Paper>
      ) : (
        <TextField
          multiline
          rows={6}
          fullWidth
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || sending}
          error={isOverLimit}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.paper',
            },
          }}
        />
      )}

      {/* Contador e acoes */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 1,
        }}
      >
        <Typography
          variant="caption"
          color={isOverLimit ? 'error' : 'text.secondary'}
        >
          {charCount.toLocaleString()} / {maxLength.toLocaleString()} caracteres
        </Typography>

        {onSend && (
          <Tooltip title="Enviar mensagem">
            <span>
              <IconButton
                color="primary"
                onClick={onSend}
                disabled={disabled || sending || !value.trim() || isOverLimit}
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
            <ListItemText primary="Nenhum template disponivel" />
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
