/**
 * Celula da grade de horarios.
 */

import { Box, Typography, alpha, useTheme, Tooltip } from '@mui/material';
import { Add as AddIcon, Person as PersonIcon } from '@mui/icons-material';
import { HorarioCellProps } from '../types';

// Paleta expandida — 20 matizes distintos para cobrir ~57 disciplinas com minimo de colisao
const DISCIPLINA_COLORS = [
  '#2563EB', '#059669', '#DC2626', '#7C3AED',
  '#EA580C', '#0891B2', '#DB2777', '#65A30D',
  '#CA8A04', '#4F46E5', '#0D9488', '#E11D48',
  '#9333EA', '#C2410C', '#0284C7', '#16A34A',
  '#A21CAF', '#B45309', '#6D28D9', '#BE185D',
];

function getColorForDisciplina(nome: string): string {
  let hash = 0;
  for (let i = 0; i < nome.length; i++) {
    hash = nome.charCodeAt(i) + ((hash << 5) - hash);
  }
  return DISCIPLINA_COLORS[Math.abs(hash) % DISCIPLINA_COLORS.length];
}

export function HorarioCell({
  horario,
  turma,
  disciplina,
  professor,
  professors,
  canEdit,
  canAddPessoal,
  onClick,
  onAddPessoal,
}: HorarioCellProps) {
  const theme = useTheme();

  if (!horario) {
    // Celula vazia - pode adicionar horario oficial (coordenador) ou pessoal (professor)
    const canInteract = canEdit || canAddPessoal;

    return (
      <Box
        onClick={canEdit ? onClick : canAddPessoal ? onAddPessoal : undefined}
        sx={{
          height: '100%',
          minHeight: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: canInteract ? 'pointer' : 'default',
          borderRadius: 1,
          border: `1px dashed ${theme.palette.divider}`,
          transition: 'all 0.2s',
          '&:hover': canInteract ? {
            bgcolor: alpha(canAddPessoal && !canEdit ? theme.palette.secondary.main : theme.palette.primary.main, 0.08),
            borderColor: canAddPessoal && !canEdit ? theme.palette.secondary.main : theme.palette.primary.main,
          } : {},
        }}
      >
        {canInteract && (
          <Tooltip title={canEdit ? 'Adicionar horario' : 'Adicionar horario pessoal'}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {canAddPessoal && !canEdit && <PersonIcon sx={{ color: theme.palette.text.disabled, fontSize: 16 }} />}
              <AddIcon sx={{ color: theme.palette.text.disabled, fontSize: 20 }} />
            </Box>
          </Tooltip>
        )}
      </Box>
    );
  }

  // Horario pessoal - estilo diferenciado
  if (horario.pessoal) {
    return (
      <Tooltip title="Horario pessoal">
        <Box
          onClick={onClick}
          sx={{
            height: '100%',
            minHeight: 60,
            p: 0.75,
            borderRadius: 1,
            bgcolor: alpha(theme.palette.secondary.main, 0.1),
            borderLeft: `3px solid ${theme.palette.secondary.main}`,
            borderStyle: 'dashed',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: alpha(theme.palette.secondary.main, 0.2),
              transform: 'scale(1.02)',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
            <PersonIcon sx={{ fontSize: 12, color: theme.palette.secondary.main }} />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: theme.palette.secondary.main,
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {horario.descricaoPessoal || 'Pessoal'}
            </Typography>
          </Box>

          {horario.sala && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: 'text.disabled',
                fontSize: '0.6rem',
                lineHeight: 1.1,
              }}
            >
              {horario.sala}
            </Typography>
          )}
        </Box>
      </Tooltip>
    );
  }

  // Cor diferente para conflitos (Trilhas com duplicidade)
  const hasConflict = horario.temConflito;
  const conflictColor = theme.palette.warning.main;

  const bgColor = hasConflict
    ? conflictColor
    : disciplina
      ? getColorForDisciplina(disciplina.nome)
      : theme.palette.grey[500];

  return (
    <Tooltip title={hasConflict ? 'Professor com duplicidade neste horário' : ''}>
      <Box
        onClick={onClick}
        sx={{
          height: '100%',
          minHeight: 60,
          p: 0.75,
          borderRadius: 1,
          bgcolor: alpha(bgColor, hasConflict ? 0.25 : 0.15),
          borderLeft: `3px solid ${bgColor}`,
          borderStyle: hasConflict ? 'dashed' : 'solid',
          cursor: 'pointer',
          transition: 'all 0.2s',
          position: 'relative',
          '&:hover': {
            bgcolor: alpha(bgColor, hasConflict ? 0.35 : 0.25),
            transform: 'scale(1.02)',
          },
          ...(hasConflict && {
            '&::after': {
              content: '"⚠"',
              position: 'absolute',
              top: 2,
              right: 4,
              fontSize: '0.7rem',
            },
          }),
        }}
      >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          display: 'block',
          color: bgColor,
          lineHeight: 1.2,
          mb: 0.25,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {disciplina?.nome || 'N/A'}
      </Typography>

      {turma && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            color: 'text.secondary',
            fontSize: '0.65rem',
            lineHeight: 1.1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {turma.nome}
        </Typography>
      )}

      {(professors && professors.length > 0) ? (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            color: 'text.secondary',
            fontSize: '0.65rem',
            lineHeight: 1.1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {professors.map(p => p.nome.split(' ')[0]).join(', ')}
        </Typography>
      ) : professor && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            color: 'text.secondary',
            fontSize: '0.65rem',
            lineHeight: 1.1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {professor.nome.split(' ')[0]}
        </Typography>
      )}

      {horario.sala && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            color: 'text.disabled',
            fontSize: '0.6rem',
            lineHeight: 1.1,
          }}
        >
          Sala {horario.sala}
        </Typography>
      )}
      </Box>
    </Tooltip>
  );
}
