/**
 * Celula de recuperacao (RP1/RP2).
 */

import { TextField } from '@mui/material';
import { getNotaColor, NOTA_COLORS } from './constants';
import { RecuperacaoCellProps } from './types';

export function RecuperacaoCell({ nota, onChange }: RecuperacaoCellProps) {
  const temNota = nota !== null && nota !== undefined;
  const colorKey = getNotaColor(nota);
  const colors = NOTA_COLORS[colorKey];

  return (
    <TextField
      size="small"
      value={nota ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="0-10"
      inputProps={{
        style: {
          textAlign: 'center',
          padding: '6px 4px',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: temNota ? colors.text : undefined,
        },
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 1,
          bgcolor: temNota ? colors.bg : 'background.paper',
          '& fieldset': {
            borderWidth: 2,
            borderColor: temNota ? colors.border : 'grey.400',
          },
          '&:hover fieldset': {
            borderColor: temNota ? colors.border : 'grey.500',
          },
          '&.Mui-focused fieldset': {
            borderColor: temNota ? colors.border : 'primary.main',
          },
        },
      }}
    />
  );
}
