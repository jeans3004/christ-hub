/**
 * Card expansivel para uma area do conhecimento.
 */

'use client';

import { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  LinearProgress,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { AreaData } from '../../hooks/useTrilhasLoader';
import { TrilhasState } from '../../hooks/useTrilhasActions';
import { SerieGroup } from './SerieGroup';

interface AreaCardProps {
  area: AreaData;
  state: TrilhasState[string];
  defaultExpanded?: boolean;
  onPresencaChange: (serie: string, alunoId: string, presente: boolean) => void;
  onMarcarTodos: (serie: string, presente: boolean) => void;
  onConteudoChange: (serie: string, conteudo: string) => void;
  onNaoRealizada: (serie: string, observacao: string) => void;
  onRealizada: (serie: string) => void;
}

export function AreaCard({
  area,
  state,
  defaultExpanded = false,
  onPresencaChange,
  onMarcarTodos,
  onConteudoChange,
  onNaoRealizada,
  onRealizada,
}: AreaCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Calcular totais
  const totalAlunos = area.series.reduce((acc, s) => acc + s.alunos.length, 0);
  const totalPresentes = area.series.reduce((acc, s) => {
    const serieState = state?.[s.serie];
    if (!serieState?.realizada) return acc;
    return acc + Object.values(serieState.presencas).filter(Boolean).length;
  }, 0);
  const percentPresentes = totalAlunos > 0 ? (totalPresentes / totalAlunos) * 100 : 0;

  // Verificar se tem series com alunos
  const seriesComAlunos = area.series.filter(s => s.alunos.length > 0);
  if (seriesComAlunos.length === 0) {
    return null;
  }

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
      sx={{
        '&:before': { display: 'none' },
        boxShadow: 2,
        mb: 1,
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          bgcolor: area.cor,
          color: 'white',
          '&:hover': { bgcolor: area.cor, opacity: 0.95 },
          '& .MuiAccordionSummary-expandIconWrapper': { color: 'white' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 2 }}>
          <Chip
            label={area.sigla}
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontWeight: 700,
            }}
          />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
            {area.nome}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`${totalPresentes}/${totalAlunos}`}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.3)', color: 'white' }}
            />
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 2 }}>
        {/* Barra de progresso */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Frequência geral
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {percentPresentes.toFixed(0)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={percentPresentes}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: area.cor,
                borderRadius: 3,
              },
            }}
          />
        </Box>

        {/* Series */}
        {seriesComAlunos.map((serieData) => (
          <SerieGroup
            key={serieData.serie}
            areaNome={area.nome}
            serieData={serieData}
            state={state?.[serieData.serie]}
            onPresencaChange={(alunoId, presente) => onPresencaChange(serieData.serie, alunoId, presente)}
            onMarcarTodos={(presente) => onMarcarTodos(serieData.serie, presente)}
            onConteudoChange={(conteudo) => onConteudoChange(serieData.serie, conteudo)}
            onNaoRealizada={(observacao) => onNaoRealizada(serieData.serie, observacao)}
            onRealizada={() => onRealizada(serieData.serie)}
          />
        ))}
      </AccordionDetails>
    </Accordion>
  );
}
