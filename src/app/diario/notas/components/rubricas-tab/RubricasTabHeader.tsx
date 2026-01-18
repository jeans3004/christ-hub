/**
 * Cabecalho da aba de rubricas.
 */

import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { Add, School } from '@mui/icons-material';
import type { RubricasTabHeaderProps } from './types';

export function RubricasTabHeader({
  showInitButton,
  initializing,
  onInitialize,
  onAddNew,
}: RubricasTabHeaderProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h6" fontWeight={600}>
        Rubricas de Avaliacao
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {showInitButton && (
          <Button
            variant="outlined"
            onClick={onInitialize}
            disabled={initializing}
            startIcon={initializing ? <CircularProgress size={16} /> : <School />}
          >
            {initializing ? 'Criando...' : 'Criar Padroes Colegiado'}
          </Button>
        )}
        <Button variant="contained" startIcon={<Add />} onClick={onAddNew}>
          Nova Rubrica
        </Button>
      </Box>
    </Box>
  );
}
