'use client';

/**
 * Componente de estado vazio para alunos.
 */

import { Paper, Typography, Button } from '@mui/material';
import { Person, Add } from '@mui/icons-material';

interface EmptyStateProps {
  filtered: boolean;
  onAdd: () => void;
}

export function EmptyState({ filtered, onAdd }: EmptyStateProps) {
  return (
    <Paper sx={{ p: 6, textAlign: 'center' }}>
      <Person sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6" color="text.secondary">
        {filtered ? 'Nenhum aluno nesta turma' : 'Nenhum aluno cadastrado'}
      </Typography>
      <Button
        variant="outlined"
        startIcon={<Add />}
        onClick={onAdd}
        sx={{ mt: 2, textTransform: 'none' }}
      >
        Cadastrar aluno
      </Button>
    </Paper>
  );
}
