/**
 * Seletor de templates de mensagem.
 */

'use client';
import { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Description, Search, Add, Star } from '@mui/icons-material';
import { TemplateMensagemCompleto, TEMPLATE_CATEGORIAS } from '../../types';

interface TemplateSelectorProps {
  templates: TemplateMensagemCompleto[];
  loading?: boolean;
  error?: string | null;
  onSelect: (template: TemplateMensagemCompleto) => void;
  onCreateNew?: () => void;
  disabled?: boolean;
  buttonVariant?: 'text' | 'outlined' | 'contained';
  buttonSize?: 'small' | 'medium' | 'large';
  showCreateButton?: boolean;
}

export function TemplateSelector({
  templates,
  loading = false,
  error = null,
  onSelect,
  onCreateNew,
  disabled = false,
  buttonVariant = 'outlined',
  buttonSize = 'medium',
  showCreateButton = true,
}: TemplateSelectorProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    if (selectedCategory) {
      filtered = filtered.filter((t) => t.categoria === selectedCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.nome.toLowerCase().includes(term) ||
          t.conteudo.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [templates, searchTerm, selectedCategory]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSearchTerm('');
    setSelectedCategory(null);
  };

  const handleSelectTemplate = (template: TemplateMensagemCompleto) => {
    onSelect(template);
    handleClose();
  };

  const getCategoryIcon = (categoria: string) => {
    const cat = TEMPLATE_CATEGORIAS.find((c) => c.value === categoria);
    return cat?.icon || '📝';
  };

  return (
    <Box>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        startIcon={<Description />}
        onClick={handleClick}
        disabled={disabled || loading}
      >
        Templates
        {templates.length > 0 && (
          <Chip
            label={templates.length}
            size="small"
            sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
          />
        )}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 450,
          },
        }}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        {/* Busca */}
        <Box sx={{ px: 2, py: 1 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Buscar template..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Filtros por categoria */}
        <Box sx={{ px: 2, pb: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          <Chip
            label="Todos"
            size="small"
            variant={selectedCategory === null ? 'filled' : 'outlined'}
            onClick={() => setSelectedCategory(null)}
          />
          {TEMPLATE_CATEGORIAS.map((cat) => (
            <Chip
              key={cat.value}
              label={cat.icon}
              size="small"
              variant={selectedCategory === cat.value ? 'filled' : 'outlined'}
              onClick={() =>
                setSelectedCategory(selectedCategory === cat.value ? null : cat.value)
              }
              title={cat.label}
            />
          ))}
        </Box>

        <Divider />

        {/* Loading */}
        {loading && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <CircularProgress size={24} />
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Carregando templates...
            </Typography>
          </Box>
        )}

        {/* Erro */}
        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error" variant="outlined">
              {error}
            </Alert>
          </Box>
        )}

        {/* Lista de templates */}
        {!loading && !error && (
          <Box sx={{ maxHeight: 280, overflow: 'auto' }}>
            {filteredTemplates.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ p: 2, textAlign: 'center' }}
              >
                {searchTerm || selectedCategory
                  ? 'Nenhum template encontrado'
                  : 'Nenhum template disponível'}
              </Typography>
            ) : (
              filteredTemplates.map((template) => (
                <MenuItem
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  sx={{
                    py: 1.5,
                    alignItems: 'flex-start',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <ListItemIcon sx={{ mt: 0.5, minWidth: 36 }}>
                    <Typography fontSize="1.2rem">
                      {getCategoryIcon(template.categoria)}
                    </Typography>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={500}>
                          {template.nome}
                        </Typography>
                        {template.usoCount > 10 && (
                          <Star sx={{ fontSize: 14, color: 'warning.main' }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {template.conteudo.substring(0, 100)}
                          {template.conteudo.length > 100 ? '...' : ''}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                          {template.variaveis.length > 0 && (
                            <Chip
                              label={`${template.variaveis.length} variáveis`}
                              size="small"
                              variant="outlined"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          )}
                          {template.mediaUrl && (
                            <Chip
                              label="Mídia"
                              size="small"
                              color="info"
                              variant="outlined"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                    }
                  />
                </MenuItem>
              ))
            )}
          </Box>
        )}

        {/* Criar novo */}
        {showCreateButton && onCreateNew && (
          <>
            <Divider />
            <MenuItem onClick={onCreateNew}>
              <ListItemIcon>
                <Add />
              </ListItemIcon>
              <ListItemText primary="Criar novo template" />
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
}
