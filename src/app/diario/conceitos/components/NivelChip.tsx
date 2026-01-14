/**
 * Componente chip para exibir nivel de rubrica.
 */

import { Box, Typography, Tooltip } from '@mui/material';
import { NivelRubrica } from '@/types';
import { NIVEL_COLORS, NIVEL_LABELS } from '../types';

interface NivelChipProps {
  nivel: NivelRubrica;
  descricao?: string;
  size?: 'small' | 'medium';
  showLabel?: boolean;
}

export function NivelChip({ nivel, descricao, size = 'medium', showLabel = false }: NivelChipProps) {
  const colors = NIVEL_COLORS[nivel];
  const label = NIVEL_LABELS[nivel];

  const content = (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        bgcolor: colors.bg,
        border: '2px solid',
        borderColor: colors.border,
        borderRadius: 1,
        px: size === 'small' ? 1 : 1.5,
        py: size === 'small' ? 0.25 : 0.5,
      }}
    >
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: size === 'small' ? '0.75rem' : '0.875rem',
          color: colors.text,
        }}
      >
        {nivel}
      </Typography>
      {showLabel && (
        <Typography
          sx={{
            fontSize: size === 'small' ? '0.65rem' : '0.75rem',
            color: colors.text,
          }}
        >
          {label}
        </Typography>
      )}
    </Box>
  );

  if (descricao) {
    return (
      <Tooltip title={descricao} arrow>
        {content}
      </Tooltip>
    );
  }

  return content;
}
