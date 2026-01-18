'use client';

/**
 * Componente de estado vazio para turmas.
 */

import { Paper, Typography, Button } from '@mui/material';
import { School, Add } from '@mui/icons-material';

interface EmptyStateProps {
  onAdd: () => void;
}

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <Paper sx={{ p: 6, textAlign: 'center' }}>
      <School sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6" color="text.secondary">
        Nenhuma turma cadastrada
      </Typography>
      <Button
        variant="outlined"
        startIcon={<Add />}
        onClick={onAdd}
        sx={{ mt: 2, textTransform: 'none' }}
      >
        Cadastrar primeira turma
      </Button>
    </Paper>
  );
}
