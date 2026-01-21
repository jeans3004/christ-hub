/**
 * Card de exibicao de template de mensagem.
 */

'use client';

import { Card, CardContent, CardActions, Typography, Button, Box, Chip, IconButton, Tooltip } from '@mui/material';
import { Send, Edit, Delete, ContentCopy } from '@mui/icons-material';
import { TemplatePreset } from '../../types';
import { TemplateCategoria } from '@/types';
import { TEMPLATE_CATEGORIAS_EXPANDIDAS } from '../../types';

interface TemplateCardProps {
  template: TemplatePreset;
  onUse: (template: TemplatePreset) => void;
  onEdit?: (template: TemplatePreset) => void;
  onDelete?: (template: TemplatePreset) => void;
  onCopy?: (template: TemplatePreset) => void;
  showActions?: boolean;
  disabled?: boolean;
}

function getCategoriaInfo(categoria: TemplateCategoria | string) {
  return TEMPLATE_CATEGORIAS_EXPANDIDAS.find((c) => c.value === categoria) || TEMPLATE_CATEGORIAS_EXPANDIDAS[5];
}

export function TemplateCard({
  template,
  onUse,
  onEdit,
  onDelete,
  onCopy,
  showActions = true,
  disabled,
}: TemplateCardProps) {
  const categoriaInfo = getCategoriaInfo(template.categoria);

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s',
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
          <Typography fontSize={24}>{template.icone}</Typography>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={600} noWrap title={template.nome}>
              {template.nome}
            </Typography>
            <Chip
              label={categoriaInfo.label}
              size="small"
              sx={{
                bgcolor: categoriaInfo.color,
                color: 'white',
                fontSize: '0.7rem',
                height: 20,
              }}
            />
          </Box>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            mb: 1,
            fontStyle: 'italic',
          }}
        >
          {template.descricao}
        </Typography>

        {template.variaveis.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
            {template.variaveis.slice(0, 4).map((v) => (
              <Chip
                key={v}
                label={`{{${v}}}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.65rem', height: 18 }}
              />
            ))}
            {template.variaveis.length > 4 && (
              <Chip
                label={`+${template.variaveis.length - 4}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.65rem', height: 18 }}
              />
            )}
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
        <Box>
          {showActions && (
            <>
              {onCopy && (
                <Tooltip title="Copiar">
                  <IconButton size="small" onClick={() => onCopy(template)}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {onEdit && (
                <Tooltip title="Editar">
                  <IconButton size="small" onClick={() => onEdit(template)}>
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip title="Excluir">
                  <IconButton size="small" color="error" onClick={() => onDelete(template)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<Send />}
          onClick={() => onUse(template)}
          disabled={disabled}
        >
          Usar
        </Button>
      </CardActions>
    </Card>
  );
}
