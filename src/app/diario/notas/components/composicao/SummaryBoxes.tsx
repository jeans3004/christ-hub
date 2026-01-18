/**
 * Caixas de resumo com maximo e nota final.
 */

import { Box, Typography } from '@mui/material';
import { getNotaColor, NOTA_COLORS } from '../table/constants';
import type { SummaryBoxesProps } from './types';

export function SummaryBoxes({ subNotasLength, totalMax, notaCalculada }: SummaryBoxesProps) {
  const colorKey = getNotaColor(notaCalculada);
  const colors = NOTA_COLORS[colorKey];

  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      {/* Maximo possivel */}
      <Box
        sx={{
          flex: 1,
          p: 2,
          bgcolor: subNotasLength > 0 ? 'primary.light' : 'grey.200',
          borderRadius: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography fontWeight={600} color={subNotasLength > 0 ? 'primary.dark' : 'grey.600'}>
          Maximo:
        </Typography>
        <Typography variant="h6" fontWeight={700} color={subNotasLength > 0 ? 'primary.dark' : 'grey.600'}>
          {totalMax}
        </Typography>
      </Box>

      {/* Nota calculada */}
      <Box
        sx={{
          flex: 1,
          p: 2,
          bgcolor: colors.bg,
          borderRadius: 2,
          border: '2px solid',
          borderColor: colors.border,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography fontWeight={600} sx={{ color: colors.text }}>
          Nota Final:
        </Typography>
        <Typography variant="h6" fontWeight={700} sx={{ color: colors.text }}>
          {notaCalculada ?? '-'}
        </Typography>
      </Box>
    </Box>
  );
}
