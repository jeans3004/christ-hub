/**
 * Estados de carregamento e vazio do modal.
 */

import { Box, CircularProgress, Typography } from '@mui/material';
import { Person } from '@mui/icons-material';

export function ModalLoading() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
      }}
    >
      <CircularProgress sx={{ mb: 2 }} />
      <Typography variant="body1" color="text.secondary">
        Carregando informacoes do aluno...
      </Typography>
    </Box>
  );
}

export function ModalEmpty() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
      }}
    >
      <Person sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6" color="text.secondary">
        Aluno nao encontrado
      </Typography>
    </Box>
  );
}
