/**
 * Celula da grade de horarios.
 */

import { Box, Typography, alpha, useTheme } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { HorarioCellProps } from '../types';

// Cores para disciplinas (hash simples baseado no nome)
const DISCIPLINA_COLORS = [
  '#1976d2', '#388e3c', '#d32f2f', '#7b1fa2',
  '#f57c00', '#0288d1', '#c2185b', '#689f38',
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
  onClick,
}: HorarioCellProps) {
  const theme = useTheme();

  if (!horario) {
    // Celula vazia
    return (
      <Box
        onClick={canEdit ? onClick : undefined}
        sx={{
          height: '100%',
          minHeight: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: canEdit ? 'pointer' : 'default',
          borderRadius: 1,
          border: `1px dashed ${theme.palette.divider}`,
          transition: 'all 0.2s',
          '&:hover': canEdit ? {
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            borderColor: theme.palette.primary.main,
          } : {},
        }}
      >
        {canEdit && (
          <AddIcon sx={{ color: theme.palette.text.disabled, fontSize: 20 }} />
        )}
      </Box>
    );
  }

  const bgColor = disciplina
    ? getColorForDisciplina(disciplina.nome)
    : theme.palette.grey[500];

  return (
    <Box
      onClick={onClick}
      sx={{
        height: '100%',
        minHeight: 60,
        p: 0.75,
        borderRadius: 1,
        bgcolor: alpha(bgColor, 0.15),
        borderLeft: `3px solid ${bgColor}`,
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          bgcolor: alpha(bgColor, 0.25),
          transform: 'scale(1.02)',
        },
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
  );
}
