/**
 * Celula de media do aluno.
 */

import { Box, Typography } from '@mui/material';
import { getNotaColor, NOTA_COLORS } from './constants';
import { MediaCellProps } from './types';

export function MediaCell({ mediaStr }: MediaCellProps) {
  const mediaNum = parseFloat(mediaStr);
  const temMedia = !isNaN(mediaNum);
  const colorKey = getNotaColor(temMedia ? mediaNum : null);
  const colors = NOTA_COLORS[colorKey];

  return (
    <Box
      sx={{
        bgcolor: temMedia ? colors.bg : 'transparent',
        border: temMedia ? '2px solid' : 'none',
        borderColor: temMedia ? colors.border : 'transparent',
        borderRadius: 1,
        py: 0.5,
        px: 0.5,
      }}
    >
      <Typography
        sx={{
          fontWeight: 600,
          fontSize: { xs: '0.85rem', sm: '0.95rem' },
          textAlign: 'center',
          color: temMedia ? colors.text : 'text.secondary',
        }}
      >
        {mediaStr}
      </Typography>
    </Box>
  );
}
