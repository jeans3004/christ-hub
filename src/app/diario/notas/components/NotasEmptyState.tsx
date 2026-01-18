/**
 * Estado vazio quando nenhuma turma/disciplina selecionada.
 */

import { Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { Star } from '@mui/icons-material';

interface NotasEmptyStateProps {
  showEmpty: boolean;
  isLoading: boolean;
  noAlunos: boolean;
}

export function NotasEmptyState({ showEmpty, isLoading, noAlunos }: NotasEmptyStateProps) {
  if (showEmpty) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 8,
          textAlign: 'center',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Star sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
        <Typography variant="body1" color="primary.main">
          Selecione a turma e disciplina para lancar notas
        </Typography>
      </Paper>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (noAlunos) {
    return (
      <Alert severity="info">
        Nenhum aluno encontrado nesta turma. Cadastre alunos primeiro.
      </Alert>
    );
  }

  return null;
}
