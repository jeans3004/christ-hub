/**
 * Grupo de alunos por serie dentro de uma area.
 */

'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  Collapse,
  Divider,
} from '@mui/material';
import {
  CheckBox as CheckAllIcon,
  IndeterminateCheckBox as UncheckAllIcon,
  Description as ConteudoIcon,
  Cancel as NaoRealizadaIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Undo as UndoIcon,
} from '@mui/icons-material';
import { SerieData, AlunoTrilha } from '../../hooks/useTrilhasLoader';
import { SerieState } from '../../hooks/useTrilhasActions';
import { TrilhaStatusBadge } from './TrilhaStatusBadge';
import { TrilhaConteudoModal } from './TrilhaConteudoModal';
import { NaoRealizadaModal } from './NaoRealizadaModal';

interface SerieGroupProps {
  areaNome: string;
  serieData: SerieData;
  state: SerieState;
  onPresencaChange: (alunoId: string, presente: boolean) => void;
  onMarcarTodos: (presente: boolean) => void;
  onConteudoChange: (conteudo: string) => void;
  onNaoRealizada: (observacao: string) => void;
  onRealizada: () => void;
}

export function SerieGroup({
  areaNome,
  serieData,
  state,
  onPresencaChange,
  onMarcarTodos,
  onConteudoChange,
  onNaoRealizada,
  onRealizada,
}: SerieGroupProps) {
  const [expanded, setExpanded] = useState(true);
  const [conteudoOpen, setConteudoOpen] = useState(false);
  const [naoRealizadaOpen, setNaoRealizadaOpen] = useState(false);

  const totalAlunos = serieData.alunos.length;
  const presentes = Object.values(state?.presencas || {}).filter(Boolean).length;

  if (totalAlunos === 0) {
    return null; // Nao mostrar series sem alunos
  }

  return (
    <Box sx={{ mb: 1 }}>
      {/* Header da Serie */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          bgcolor: 'grey.50',
          borderRadius: 1,
          flexWrap: 'wrap',
        }}
      >
        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
          {expanded ? <CollapseIcon /> : <ExpandIcon />}
        </IconButton>

        <Typography variant="subtitle2" sx={{ fontWeight: 600, minWidth: 80 }}>
          {serieData.serie}
        </Typography>

        <TrilhaStatusBadge
          realizada={state?.realizada ?? true}
          hasChanges={state?.hasChanges ?? false}
          hasChamada={!!serieData.chamada}
          observacao={state?.observacao}
        />

        <Chip
          size="small"
          label={`${presentes}/${totalAlunos}`}
          color={presentes === totalAlunos ? 'success' : 'default'}
          variant="outlined"
        />

        <Box sx={{ flex: 1 }} />

        {/* Botoes de acao */}
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {state?.realizada ? (
            <>
              <Button
                size="small"
                startIcon={<CheckAllIcon />}
                onClick={() => onMarcarTodos(true)}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                Todos P
              </Button>
              <Button
                size="small"
                startIcon={<UncheckAllIcon />}
                onClick={() => onMarcarTodos(false)}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                Todos F
              </Button>
              <Button
                size="small"
                startIcon={<ConteudoIcon />}
                onClick={() => setConteudoOpen(true)}
                color={state?.conteudo ? 'primary' : 'inherit'}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                Conteúdo
              </Button>
              <Button
                size="small"
                startIcon={<NaoRealizadaIcon />}
                onClick={() => setNaoRealizadaOpen(true)}
                color="error"
                sx={{ minWidth: 'auto', px: 1 }}
              >
                Não Realizada
              </Button>
            </>
          ) : (
            <Button
              size="small"
              startIcon={<UndoIcon />}
              onClick={onRealizada}
              color="success"
            >
              Marcar como Realizada
            </Button>
          )}
        </Box>
      </Box>

      {/* Lista de alunos */}
      <Collapse in={expanded && state?.realizada}>
        <List dense disablePadding sx={{ pl: 2 }}>
          {serieData.alunos.map((aluno) => (
            <ListItem key={aluno.id} disablePadding>
              <ListItemButton
                dense
                onClick={() => onPresencaChange(aluno.id, !state?.presencas[aluno.id])}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Checkbox
                    edge="start"
                    checked={state?.presencas[aluno.id] ?? true}
                    tabIndex={-1}
                    disableRipple
                    color="success"
                  />
                </ListItemIcon>
                <ListItemText
                  primary={aluno.nome}
                  secondary={aluno.turmaNome}
                  primaryTypographyProps={{
                    variant: 'body2',
                    sx: {
                      textDecoration: state?.presencas[aluno.id] === false ? 'line-through' : 'none',
                      color: state?.presencas[aluno.id] === false ? 'text.disabled' : 'text.primary',
                    },
                  }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Collapse>

      {/* Modal de Conteudo */}
      <TrilhaConteudoModal
        open={conteudoOpen}
        areaNome={areaNome}
        serie={serieData.serie}
        conteudo={state?.conteudo || ''}
        onClose={() => setConteudoOpen(false)}
        onSave={onConteudoChange}
      />

      {/* Modal de Nao Realizada */}
      <NaoRealizadaModal
        open={naoRealizadaOpen}
        areaNome={areaNome}
        serie={serieData.serie}
        onClose={() => setNaoRealizadaOpen(false)}
        onConfirm={onNaoRealizada}
      />
    </Box>
  );
}
