'use client';

/**
 * Componente de abas para visualizar mapeamentos de diferentes professores.
 * Redesign com melhor visual.
 */

import { useMemo, useEffect } from 'react';
import { Box, Tabs, Tab, Chip, Typography, Tooltip, Paper } from '@mui/material';
import { Star, Edit, Visibility, Person } from '@mui/icons-material';
import { MapeamentoComProfessor } from '../hooks/mapeamentoTypes';

interface ProfessorTabsProps {
  mapeamentos: MapeamentoComProfessor[];
  professorIdVisualizando: string | null;
  onProfessorChange: (professorId: string | null) => void;
  conselheiroId: string | null;
  usuarioId: string;
}

export function ProfessorTabs({
  mapeamentos,
  professorIdVisualizando,
  onProfessorChange,
  conselheiroId,
  usuarioId,
}: ProfessorTabsProps) {
  // Agrupar mapeamentos por professor (removendo duplicados por disciplina)
  const professoresUnicos = useMemo(() => {
    const map = new Map<string, { id: string; nome: string; isConselheiro: boolean }>();
    mapeamentos.forEach(m => {
      if (!map.has(m.professorId)) {
        map.set(m.professorId, {
          id: m.professorId,
          nome: m.professorNome || 'Desconhecido',
          isConselheiro: m.isConselheiro || false,
        });
      }
    });
    // Ordenar: conselheiro primeiro, depois usuario atual, depois alfabeticamente
    return Array.from(map.values()).sort((a, b) => {
      if (a.isConselheiro && !b.isConselheiro) return -1;
      if (!a.isConselheiro && b.isConselheiro) return 1;
      if (a.id === usuarioId && b.id !== usuarioId) return -1;
      if (a.id !== usuarioId && b.id === usuarioId) return 1;
      return a.nome.localeCompare(b.nome);
    });
  }, [mapeamentos, usuarioId]);

  // Verificar se o professor selecionado ainda existe na lista
  const professorIdsValidos = useMemo(() =>
    new Set(professoresUnicos.map(p => p.id)),
    [professoresUnicos]
  );

  // Reset para "meu" se o professor selecionado nao existe mais
  useEffect(() => {
    if (professorIdVisualizando && !professorIdsValidos.has(professorIdVisualizando)) {
      onProfessorChange(null);
    }
  }, [professorIdVisualizando, professorIdsValidos, onProfessorChange]);

  if (professoresUnicos.length === 0) {
    return null;
  }

  // Valor atual: null ou ID invalido = "Meu mapeamento", string valido = ID do professor
  const tabValue = (professorIdVisualizando && professorIdsValidos.has(professorIdVisualizando))
    ? professorIdVisualizando
    : 'meu';

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    if (newValue === 'meu') {
      onProfessorChange(null);
    } else {
      onProfessorChange(newValue);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2,
        bgcolor: 'grey.50',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'grey.200',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person sx={{ color: 'text.secondary', fontSize: 20 }} />
          <Typography variant="subtitle2" color="text.secondary" fontWeight={500}>
            Mapeamentos da Turma
          </Typography>
        </Box>
      </Box>

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          px: 1,
          bgcolor: 'background.paper',
          '& .MuiTab-root': {
            minHeight: 48,
            textTransform: 'none',
            fontWeight: 500,
            '&.Mui-selected': {
              fontWeight: 600,
            },
          },
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0',
          },
        }}
      >
        <Tab
          value="meu"
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Edit fontSize="small" />
              <span>Meu mapeamento</span>
            </Box>
          }
        />
        {professoresUnicos.map((prof) => (
          <Tab
            key={prof.id}
            value={prof.id}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {prof.isConselheiro ? (
                  <Tooltip title="Mapeamento do Conselheiro (Padrao)">
                    <Star fontSize="small" sx={{ color: 'warning.main' }} />
                  </Tooltip>
                ) : (
                  <Visibility fontSize="small" sx={{ color: 'text.secondary' }} />
                )}
                <span>{prof.nome.split(' ')[0]}</span>
                {prof.isConselheiro && (
                  <Chip
                    label="Conselheiro"
                    size="small"
                    sx={{
                      ml: 0.5,
                      height: 18,
                      fontSize: '0.65rem',
                      bgcolor: 'warning.main',
                      color: 'white',
                      fontWeight: 600,
                    }}
                  />
                )}
                {prof.id === usuarioId && !prof.isConselheiro && (
                  <Chip
                    label="Voce"
                    size="small"
                    color="primary"
                    sx={{ ml: 0.5, height: 18, fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            }
          />
        ))}
      </Tabs>

      {professorIdVisualizando && (
        <Box sx={{
          px: 2,
          py: 1.5,
          bgcolor: 'info.light',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}>
          <Visibility sx={{ color: 'info.dark', fontSize: 18 }} />
          <Typography variant="body2" color="info.dark" fontWeight={500}>
            Modo visualizacao - vendo o mapeamento de outro professor
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
