/**
 * Chip para exibir nivel de rubrica.
 */

import { Chip } from '@mui/material';
import { NivelRubrica } from '@/types';
import { NIVEL_COLORS } from '../../types';

interface NivelChipProps {
  nivel: NivelRubrica;
  showLabel?: boolean;
}

export function NivelChip({ nivel, showLabel }: NivelChipProps) {
  const colors = NIVEL_COLORS[nivel];
  return (
    <Chip
      label={showLabel ? `${nivel}` : nivel}
      size="small"
      sx={{
        bgcolor: colors.bg,
        color: colors.text,
        border: '1px solid',
        borderColor: colors.border,
        fontWeight: 700,
      }}
    />
  );
}
