/**
 * Estado vazio de comunicados.
 */

import { Paper, Typography } from '@mui/material';

export function EmptyAnnouncements() {
  return (
    <Paper
      sx={{
        p: 6,
        textAlign: 'center',
        borderRadius: '12px',
      }}
    >
      <Typography sx={{ fontSize: '1rem', fontWeight: 500, color: '#374151', mb: 1 }}>
        Nenhum comunicado no momento
      </Typography>
      <Typography sx={{ fontSize: '0.875rem', color: '#6B7280', maxWidth: 400, mx: 'auto' }}>
        Os comunicados de coordenadores e administradores aparecerao aqui.
      </Typography>
    </Paper>
  );
}
