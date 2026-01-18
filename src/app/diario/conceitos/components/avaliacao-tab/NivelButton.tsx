/**
 * Botao de nivel de avaliacao.
 */

import { Box, Tooltip } from '@mui/material';
import { NivelRubrica } from '@/types';
import { NIVEL_COLORS } from '../../types';

interface NivelButtonProps {
  nivel: NivelRubrica;
  isSelected: boolean;
  description: string;
  onClick: () => void;
}

export function NivelButton({ nivel, isSelected, description, onClick }: NivelButtonProps) {
  const colors = NIVEL_COLORS[nivel];

  return (
    <Tooltip title={description || `Nível ${nivel}`}>
      <Box
        onClick={onClick}
        sx={{
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 0.5,
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '0.75rem',
          bgcolor: isSelected ? colors.bg : 'transparent',
          border: '2px solid',
          borderColor: isSelected ? colors.border : 'grey.300',
          color: isSelected ? colors.text : 'grey.500',
          transition: 'all 0.15s',
          '&:hover': {
            borderColor: colors.border,
            bgcolor: colors.bg,
            color: colors.text,
          },
        }}
      >
        {nivel}
      </Box>
    </Tooltip>
  );
}
