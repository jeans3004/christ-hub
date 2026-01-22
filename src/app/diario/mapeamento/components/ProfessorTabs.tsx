'use client';

/**
 * Componente de abas para visualizar mapeamentos de diferentes professores.
 */

import { useMemo, useEffect } from 'react';
import { Box, Tabs, Tab, Chip, Typography, Tooltip } from '@mui/material';
import { Star, Edit } from '@mui/icons-material';
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
    // Ordenar: conselheiro primeiro, depois usuário atual, depois alfabeticamente
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

  // Reset para "meu" se o professor selecionado não existe mais
  useEffect(() => {
    if (professorIdVisualizando && !professorIdsValidos.has(professorIdVisualizando)) {
      onProfessorChange(null);
    }
  }, [professorIdVisualizando, professorIdsValidos, onProfessorChange]);

  if (professoresUnicos.length === 0) {
    return null;
  }

  // Valor atual: null ou ID inválido = "Meu mapeamento", string válido = ID do professor
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
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
        Visualizar mapeamento de:
      </Typography>
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': {
            minHeight: 48,
            textTransform: 'none',
          },
        }}
      >
        <Tab
          value="meu"
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {prof.isConselheiro && (
                  <Tooltip title="Professor Conselheiro">
                    <Star fontSize="small" color="warning" />
                  </Tooltip>
                )}
                <span>{prof.nome}</span>
                {prof.id === usuarioId && (
                  <Chip label="Você" size="small" color="primary" sx={{ ml: 0.5, height: 20 }} />
                )}
              </Box>
            }
          />
        ))}
      </Tabs>
      {professorIdVisualizando && (
        <Box sx={{ mt: 1, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="body2" color="info.contrastText">
            Modo visualização - você está vendo o mapeamento de outro professor. Clique em "Meu mapeamento" para editar o seu.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
