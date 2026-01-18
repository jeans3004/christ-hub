/**
 * Item de detalhe de rubrica no modal de composicao.
 */

import { Box, Typography, Chip } from '@mui/material';
import { NIVEL_COLORS } from '../rubrica/constants';
import { NIVEL_PERCENTUAL } from './constants';
import type { RubricaDetalheItemProps } from './types';

export function RubricaDetalheItem({ rubrica }: RubricaDetalheItemProps) {
  const nivelColors = rubrica.nivel ? NIVEL_COLORS[rubrica.nivel] : null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        bgcolor: 'white',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'grey.200',
      }}
    >
      <Typography variant="body2" sx={{ flex: 1 }}>
        {rubrica.rubricaNome}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        max: {rubrica.valorMaximo.toFixed(2)}
      </Typography>
      {rubrica.nivel ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1,
            py: 0.5,
            borderRadius: 1,
            bgcolor: nivelColors?.bg,
            border: '1px solid',
            borderColor: nivelColors?.border,
          }}
        >
          <Typography variant="body2" fontWeight={700} sx={{ color: nivelColors?.text }}>
            {rubrica.nivel}
          </Typography>
          <Typography variant="caption" sx={{ color: nivelColors?.text }}>
            ({NIVEL_PERCENTUAL[rubrica.nivel]}%)
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            = {rubrica.valorCalculado?.toFixed(2)}
          </Typography>
        </Box>
      ) : (
        <Chip label="Nao avaliada" size="small" variant="outlined" color="warning" />
      )}
    </Box>
  );
}
