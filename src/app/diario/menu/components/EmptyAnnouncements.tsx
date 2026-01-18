/**
 * Estado vazio de comunicados.
 */

import { Paper, Typography } from '@mui/material';

export function EmptyAnnouncements() {
  return (
    <Paper
      sx={{
        p: 4,
        textAlign: 'center',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        borderRadius: 3,
      }}
    >
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Nenhum comunicado no momento
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Os comunicados de coordenadores e administradores aparecerao aqui.
      </Typography>
    </Paper>
  );
}
