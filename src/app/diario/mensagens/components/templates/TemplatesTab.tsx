/**
 * Tab de gerenciamento de templates de mensagem.
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import { Search, Description } from '@mui/icons-material';
import { TEMPLATE_PRESETS, TEMPLATE_CATEGORIAS_EXPANDIDAS } from '../../constants';
import { TemplatePreset } from '../../types';
import { TemplateCard } from './TemplateCard';

type CategoriaFilter = 'todos' | string;

interface TemplatesTabProps {
  onUseTemplate: (template: TemplatePreset) => void;
  disabled?: boolean;
}

export function TemplatesTab({ onUseTemplate, disabled }: TemplatesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<CategoriaFilter>('todos');

  const filteredTemplates = useMemo(() => {
    return TEMPLATE_PRESETS.filter((t) => {
      const matchSearch =
        t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategoria = categoriaFilter === 'todos' || t.categoria === categoriaFilter;
      return matchSearch && matchCategoria;
    });
  }, [searchTerm, categoriaFilter]);

  const handleCopy = useCallback((template: TemplatePreset) => {
    navigator.clipboard.writeText(template.conteudo);
  }, []);

  return (
    <Box>
      {/* Filtros */}
      <Box sx={{ mb: 3 }}>
        <TextField
          placeholder="Buscar template..."
          size="small"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

        <Tabs
          value={categoriaFilter}
          onChange={(_, v) => setCategoriaFilter(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Todos" value="todos" />
          {TEMPLATE_CATEGORIAS_EXPANDIDAS.map((cat) => (
            <Tab
              key={cat.value}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </Box>
              }
              value={cat.value}
            />
          ))}
        </Tabs>
      </Box>

      {/* Info */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Selecione um template para usar como base da sua mensagem. As variaveis entre {'{{'} e {'}}'}
        serao substituidas pelos valores informados.
      </Alert>

      {/* Contador */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {filteredTemplates.length} template(s) disponivel(is)
      </Typography>

      {/* Grid de templates */}
      {filteredTemplates.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <Description sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6">Nenhum template encontrado</Typography>
          <Typography variant="body2">Tente buscar por outro termo ou categoria</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filteredTemplates.map((template) => (
            <Grid key={template.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <TemplateCard
                template={template}
                onUse={onUseTemplate}
                onCopy={handleCopy}
                showActions={false}
                disabled={disabled}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
