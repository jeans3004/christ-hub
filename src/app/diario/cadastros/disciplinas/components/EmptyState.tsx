'use client';

/**
 * Componente de estado vazio para disciplinas.
 */

import { Paper, Typography, Button } from '@mui/material';
import { MenuBook, Add } from '@mui/icons-material';

interface EmptyStateProps {
  onAdd: () => void;
}

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <Paper sx={{ p: 6, textAlign: 'center' }}>
      <MenuBook sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6" color="text.secondary">
        Nenhuma disciplina cadastrada
      </Typography>
      <Button
        variant="outlined"
        startIcon={<Add />}
        onClick={onAdd}
        sx={{ mt: 2, textTransform: 'none' }}
      >
        Cadastrar primeira disciplina
      </Button>
    </Paper>
  );
}
